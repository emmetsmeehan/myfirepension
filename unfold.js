/* Unfold accordion for Pension basics and the Other accounts questions (matches easyui.site's UnfoldAccordion).
   One open at a time. The chevron flips right away with a slight spring; the answer's height unfolds
   (a calm, no-overshoot curve, ~420ms) while its text rises 6px and fades in a little faster, so it leads.
   Closing runs the same motion backwards. The page doesn't jump. */
(function(){
  var SEL='.qa>details>summary, .qs>details.q>summary';
  var H_MS=420,H_EASE='cubic-bezier(.22,1,.36,1)',T_MS=280,T_EASE='cubic-bezier(.16,1,.3,1)';
  var still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Wrap each answer once so its height can animate on its own. */
  function body(d){
    if(d._b) return d._b;
    var w=document.createElement('div');w.style.overflow='hidden';
    Array.prototype.slice.call(d.children).forEach(function(c){if(c.tagName!=='SUMMARY')w.appendChild(c)});
    d.appendChild(w);d._b=w;return w;
  }
  function stop(d){(d._a||[]).forEach(function(a){a.cancel()});d._a=null}
  function open(d){
    var w=body(d);stop(d);d.open=true;d.classList.add('isopen');
    if(still) return;
    var h=w.scrollHeight,inner=w.firstElementChild;
    d._a=[w.animate([{height:'0px',opacity:0},{height:h+'px',opacity:1}],{duration:H_MS,easing:H_EASE})];
    if(inner) d._a.push(inner.animate([{transform:'translateY(-6px)',opacity:0},{transform:'none',opacity:1}],{duration:T_MS,easing:T_EASE}));
    d._a[0].onfinish=function(){d._a=null};
  }
  function close(d){
    var w=body(d);stop(d);d.classList.remove('isopen');
    if(still){d.open=false;return}
    var h=w.offsetHeight,inner=w.firstElementChild;
    d._a=[w.animate([{height:h+'px',opacity:1},{height:'0px',opacity:0}],{duration:H_MS*.8,easing:H_EASE,fill:'forwards'})];
    if(inner) d._a.push(inner.animate([{transform:'none',opacity:1},{transform:'translateY(-6px)',opacity:0}],{duration:T_MS*.8,easing:T_EASE,fill:'forwards'}));
    d._a[0].onfinish=function(){d.open=false;stop(d)};
  }
  /* Answers already open on load, or opened by other code (the "Learn more about the Social Security offset"
     link), get the open look, and the others close. */
  function isQ(d){return d&&d.matches&&d.matches('.qa>details, .qs>details.q')}
  document.querySelectorAll('.qa>details[open], .qs>details.q[open]').forEach(function(d){d.classList.add('isopen')});
  document.addEventListener('toggle',function(e){var d=e.target;if(!isQ(d)||d._a) return;
    if(d.open&&!d.classList.contains('isopen')){d.classList.add('isopen');
      Array.prototype.forEach.call(d.parentElement.children,function(o){if(o!==d&&o.open){o.open=false;o.classList.remove('isopen')}})}
    else if(!d.open) d.classList.remove('isopen');
  },true);
  document.addEventListener('click',function(e){
    var s=e.target.closest&&e.target.closest(SEL);if(!s) return;
    var d=s.parentElement;e.preventDefault();
    if(d.classList.contains('isopen')){close(d);return}
    Array.prototype.forEach.call(d.parentElement.children,function(o){if(o!==d&&o.classList&&o.classList.contains('isopen'))close(o)});
    open(d);
    setTimeout(function(){
      var bar=document.querySelector('.view:not([hidden]) .topbar, .top'),off=(bar?bar.getBoundingClientRect().bottom:0)+8,t=s.getBoundingClientRect().top;
      if(t<off) window.scrollBy({top:t-off,behavior:'smooth'});
    },still?0:H_MS);
  });
})();
