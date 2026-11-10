// Calculator test cases: node tests/run.mjs (run "npm install" in tests/ once first).
// Loads each tier page in jsdom with the case's numbers saved, runs the page's own math, and checks the answers.
// Cases come from tests/cases.json (made-up members, figured by hand from the rules) and, when present,
// tests/private-cases.json (real members' Fund portal estimates; never committed, see .gitignore).
import {readFileSync, existsSync} from 'node:fs';
import {JSDOM, VirtualConsole} from 'jsdom';

const root = new URL('..', import.meta.url).pathname;
const read = p => readFileSync(root + p, 'utf8');
const rulesJs = existsSync(root + 'rules.js') ? read('rules.js') : '';
// The iPhone app reads rules.js as JSON: everything after the last "window.RULES =", minus the final semicolon.
if (rulesJs) {
  const i = rulesJs.lastIndexOf('window.RULES =');
  try {JSON.parse(rulesJs.slice(i + 14).trim().replace(/;$/, ''))}
  catch (e) {console.log('FAIL  rules.js is not strict JSON after "window.RULES =", so the app can\'t read it:\n      ' + e.message); process.exit(1)}
}
// Every change to the site bumps version.js (owner, Nov. 9, 2026). Compared with origin/main; skipped without git.
import {execSync} from 'node:child_process';
try {
  const sh = c => execSync(c, {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']});
  const changed = (sh('git diff --name-only origin/main') + sh('git ls-files --others --exclude-standard')).split('\n')
    .filter(f => f && !/^(CLAUDE\.md|\.gitignore|version\.js|tests\/)/.test(f));
  let old = '';try {old = sh('git show origin/main:version.js')} catch {}
  if (changed.length && old && old === read('version.js')) {
    console.log('FAIL  The site changed but version.js didn\'t. Run: node tests/bump.mjs\n      Changed: ' + changed.join(', '));
    process.exit(1);
  }
} catch {}
// The home pages show the version inline; it must match version.js.
{const v = (read('version.js').match(/SITE_VERSION = "([\d.]+)"/) || [])[1];
 for (const f of ['index.html', 'tier2/index.html', 'tier3/index.html', 'updates/index.html', 'suggest/index.html', 'privacy/index.html', 'accounts/index.html', '404.html'])
   {const all = [...read(f).matchAll(/Version <b>([\d.]+)<\/b>/g)].map(m => m[1]);
    if (!all.length || all.some(x => x !== v)) {console.log(`FAIL  ${f} doesn't show version ${v} everywhere. Run: node tests/bump.mjs`); process.exit(1)}}}
const pages = {
  3: {html: read('tier3/index.html'), key: 'fdny-tier3-v2', url: 'https://myfirepension.com/tier3/'},
  2: {html: read('tier2/index.html'), key: 'fdny-tier2-v1', url: 'https://myfirepension.com/tier2/'},
};

const files = ['tests/cases.json', 'tests/private-cases.json'].filter(f => existsSync(root + f));
const cases = files.flatMap(f => JSON.parse(read(f)).cases.map(c => ({...c, file: f})));

function run(c) {
  const pg = pages[c.tier];
  // The page loads rules.js with a script tag; jsdom doesn't fetch files, so put it inline.
  const html = pg.html.replace(/<script src="\/rules\.js[^"]*"><\/script>/, `<script>${rulesJs}</script>`);
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(e.message));
  const months = c.months ?? Math.round(c.years * 12);
  const p = {dob: c.dob, appt: c.appt, mode: 'manual', manual: c.earnings, svc: months, dis: !!c.dis,
    rank: c.rank || 'FF', rankSet: true, cur: '', earnV: 2, ss: c.ss ?? 2400, cpi: c.cpi ?? 3, b40: false};
  if (c.topPay) p.topPay = c.topPay;
  if (c.eq) {p.eqOn = true; p.eq = c.eq}
  const dom = new JSDOM(html, {
    url: pg.url, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.localStorage.setItem(pg.key, JSON.stringify({q: {}, p}));
      w.matchMedia = () => ({matches: false, addEventListener() {}, removeEventListener() {}});
      w.fetch = () => Promise.resolve({ok: false, text: () => Promise.resolve('')});
      w.scrollTo = () => {};
      w.IntersectionObserver = class {observe() {} unobserve() {} disconnect() {}};
    },
  });
  try {
    if (!dom.window.eval('typeof scenario')?.startsWith('function')) throw new Error('page script did not load: ' + errors.join('; '));
    // Rank top pay comes from the page's own rank table unless the case types one.
    if (!c.topPay) dom.window.eval(`ST.p.topPay=RANKS.find(r=>r.id===${JSON.stringify(c.rank || 'FF')}).pay`);
    return JSON.parse(dom.window.eval(`JSON.stringify((()=>{const c=pParams(),r=scenario(${months},c);
      return {monthly:r.base/12,fas:r.fas??((r.fs||0)+(r.bonusAdd||0)),frac:r.frac,ok:r.ok!==false,
        at62:r.at&&r.at(62)?r.at(62).pay/12:null,errors:${JSON.stringify(errors)}}})())`));
  } finally {dom.window.close()}
}

let fail = 0;
for (const c of cases) {
  let got;
  try {got = run(c)} catch (e) {fail++; console.log(`FAIL  ${c.name}\n      ${e.message}`); continue}
  const tol = c.tolerance ?? 1, bad = [];
  if (!got.ok) bad.push('page says the earnings are incomplete');
  for (const [k, want] of Object.entries(c.expect)) {
    const v = got[k], t = k === 'frac' ? 0.001 : tol;
    if (typeof v !== 'number' || Math.abs(v - want) > t) bad.push(`${k}: expected ${want}, page gives ${v === null || v === undefined ? v : +v.toFixed(4)}`);
  }
  if (bad.length) {fail++; console.log(`FAIL  ${c.name} (${c.file})\n      ${bad.join('\n      ')}`)}
  else console.log(`ok    ${c.name}`);
}
console.log(`\n${cases.length - fail} of ${cases.length} passed${files.includes('tests/private-cases.json') ? '' : ' (no private member cases on this machine)'}`);
process.exit(fail ? 1 : 0);
