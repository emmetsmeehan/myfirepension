/* My Fire Pension: Tier 3 rules engine.
   Shared by the website (tier3/index.html loads it before its own script) and the iPhone app (runs it in JavaScriptCore).
   Keep this file free of anything that touches the page (no document, window, localStorage): the app has none of them.
   When you change it, bump the ?v= on its <script> tag in tier3/index.html so browsers and the update check pick it up,
   and bump ENGINE_T3 when a function's inputs or outputs change, so the app knows what it's running. */
const ENGINE_T3=1;

/* Typed amounts: "$120,000", "120k" and "120.000" (dot for thousands) all read as 120000; minus signs and letters are dropped. */
const num=v=>{let s=String(v).toLowerCase().replace(/[\s$]/g,'');const k=/\dk$/.test(s);if(/^\d{1,3}(\.\d{3})+k?$/.test(s))s=s.replace(/\./g,'');const n=parseFloat(s.replace(/[^0-9.]/g,''));return isFinite(n)?n*(k?1000:1):0};

const VSF=12000;

const RANKS=[{id:'FF',pay:109352},{id:'LT',pay:140212},{id:'CAPT',pay:160941},{id:'BC',pay:209563},{id:'DC',pay:232278}];

/* ---------- bills: one place for every bill shown on the page ---------- */
const SEN='https://www.nysenate.gov/legislation/bills/2025/';
const STEP_LABELS=['Introduced','In committee','Passed the Senate','Passed the Assembly','Signed by the governor'];
const BILLS=[
  {id:'esc20',kind:'esc',val:20,title:'Full escalation at 20 years',check:'Full escalation at 20 years',nums:['S9203','A10254'],intro:'Feb. 13, 2026',
   what:'Full escalation as soon as you can retire, at 20 years, instead of 23.',
   committee:'Senate Civil Service and Pensions',step:1},
  {id:'b40',kind:'flag',title:'Extra 1/40th for each year past 20',check:'Extra 1/40th for each year past 20',nums:['S5058A'],intro:'Feb. 18, 2025',
   what:'For each year you work past 20, your pension would add 1/40th of your final average salary on top of the 50%. Five extra years would add 12.5% of your final average salary. (Tier 2 members would get 1/40th instead of 1/60th of their earnings after 20.)',
   note:'Amended in 2026 (S5058A).',committee:'Senate Civil Service and Pensions',step:1},
  {id:'esc23',law:true,title:'Full escalation at 23 years',nums:['S9204','A11269','S9008'],intro:'Feb. 13, 2026',signed:'May 27, 2026',chapter:'in the FY2027 state budget',
   what:'Your whole pension grows with inflation (up to 3% a year) if you retire with 23 years instead of 25. Partial escalation now starts after 20 years instead of 22.',
   note:'This passed in the state budget (S9008-C / A10008-C, Part ZZ), so the bill’s own page on nysenate.gov still says “in committee.”',step:5},
  {id:'yearly',law:true,title:'Longevity bonus at 25 years',nums:['S9202','A10392','S9008'],intro:'Feb. 13, 2026',signed:'May 27, 2026',chapter:'in the FY2027 state budget',
   what:'If you retire with 25 years or more, part of your rank’s top pay is added to the salary your pension is based on: 5% at 25 years, plus 1% more for each year after, up to 15% at 35.',
   note:'This passed in the state budget (S9008-C / A10008-C, Part AAA), so the bill’s own page on nysenate.gov still says “in committee.”',step:5},
  {id:'s4727',law:true,title:'50% at 20 years',nums:['S4727'],intro:'2025',signed:'Dec. 19, 2025',chapter:'Chapter 692 of the Laws of 2025',
   what:'Tier 3 pays 50% of your final average salary once you have 20 years.',step:5}
];
/* Current law, used by both calculators: full escalation at 23 years and the +1% a year longevity bonus (FY2027 state budget, signed May 27, 2026). */
const LAW_ESC=23,LAW_BONUS='yearly';
const PENDING=BILLS.filter(b=>!b.law);
/* Bills that don't pass by the end of the two-year session die and have to be introduced again with new numbers. */
const SESSION_END='This is a 2025–26 bill. The session ends Dec. 31, 2026. If it hasn’t passed by then, it dies and would have to be introduced again in 2027 under a new number.';

/* ---------- pension rules ---------- */
/* Longevity bonus (law since May 27, 2026, FY2027 budget; originally S9202/A10392): 5% at 25 plus 1% per year past 25, capped at 15%.
   'steps' is the S9306/A10438 version that did not pass, kept only for reference. */
function bonusPct(S,ver){
  if(!ver||S<25-1e-9) return 0;
  if(ver==='yearly') return Math.min(0.15,0.05+0.01*Math.floor(S-25+1e-9));
  return S>=35-1e-9?0.15:S>=30-1e-9?0.10:0.05;
}
/* Full escalation from F years of service (23 under current law); 1/36 less for each month short, none at 3+ years short. */
function escFrac(S,F){const before=Math.max(0,Math.round((F-S)*12));return before>=36?0:(36-before)/36}
function colaRateOf(cpi){let r=Math.ceil(cpi*100/2*10-1e-9)/10/100;return Math.min(0.03,Math.max(0.01,r))}

/* 2026 federal income tax (IRS Rev. Proc. 2025-32): standard deduction, then [top of bracket, rate] on taxable income. */
const FED={mfj:{ded:32200,b:[[24800,.10],[100800,.12],[211400,.22],[403550,.24],[512450,.32],[768700,.35],[Infinity,.37]]},
  single:{ded:16100,b:[[12400,.10],[50400,.12],[105700,.22],[201775,.24],[256225,.32],[640600,.35],[Infinity,.37]]}};
function fedTax(inc,st){let t=0,lo=0;const x=Math.max(0,inc-FED[st].ded);for(const [hi,r] of FED[st].b){if(x>lo)t+=(Math.min(x,hi)-lo)*r;lo=hi}return t}

/* Quick calculator: first-year pension from a typed final average salary.
   months = service in months; dis = 3/4s; topPay = rank top pay for the bonus; esc = full-escalation year (LAW_ESC, or 20 if S9203 is checked);
   b40 = S5058A checked (an extra 1/40th of FAS for each year past 20, prorated by month). */
function quickResult(fas,months,dis,topPay,esc,b40){
  const S=months/12,bp=dis?0:bonusPct(S,LAW_BONUS),add=bp*topPay,extra=!dis&&b40?fas*Math.max(0,months-240)/12/40:0;
  const base=(dis?0.75:0.5)*(fas+add)+extra,frac=dis?0:escFrac(S,esc);
  return {bp,add,extra,base,mon:base/12,frac,r:frac*0.03};
}
