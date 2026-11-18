/* Preview branch only: "unfold" accordion for Pension basics and the Other accounts questions.
   One open at a time. The answer's height grows smoothly while its text slides up into place;
   closing folds it back. The page doesn't jump: only if the tapped question ends up under the
   sticky bar is it lined up just below the bar, after the motion ends. */
(function(){
  var SEL='.qa>details>summary, .qs>details.q>summary';
  var DUR=340,EASE='cubic-bezier(.2,.8,.2,1)';
  var still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function kids(d){return Array.prototype.filter.call(d.children,function(c){return c.tagName!=='SUMMARY'})}
  function stop(d){if(d._a){d._a.forEach(function(a){a.cancel()});d._a=null}d.classList.remove('closing');d.style.height=''}
  function open(d){
    stop(d);var h0=d.offsetHeight;d.open=true;var h1=d.offsetHeight;
    if(still) return;
    d._a=[d.animate([{height:h0+'px'},{height:h1+'px'}],{duration:DUR,easing:EASE})];
    kids(d).forEach(function(k){d._a.push(k.animate([{opacity:0,transform:'translateY(-10px)'},{opacity:1,transform:'none'}],{duration:DUR,easing:EASE}))});
    d._a[0].onfinish=function(){d._a=null};
  }
  function close(d){
    if(!d.open) return;stop(d);
    if(still){d.open=false;return}
    var h0=d.offsetHeight,h1=d.querySelector('summary').offsetHeight+(d.offsetHeight-d.clientHeight);
    d.classList.add('closing');
    d._a=[d.animate([{height:h0+'px'},{height:h1+'px'}],{duration:DUR*.8,easing:EASE})];
    kids(d).forEach(function(k){d._a.push(k.animate([{opacity:1},{opacity:0,transform:'translateY(-6px)'}],{duration:DUR*.6,easing:EASE,fill:'forwards'}))});
    d._a[0].onfinish=function(){d._a.forEach(function(a){a.cancel()});d._a=null;d.open=false;d.classList.remove('closing')};
  }
  document.addEventListener('click',function(e){
    var s=e.target.closest&&e.target.closest(SEL);if(!s) return;
    var d=s.parentElement;e.preventDefault();
    if(d.open&&!d.classList.contains('closing')){close(d);return}
    Array.prototype.forEach.call(d.parentElement.children,function(o){if(o!==d&&o.tagName==='DETAILS'&&o.open)close(o)});
    open(d);
    setTimeout(function(){
      var bar=document.querySelector('.view:not([hidden]) .topbar, .top'),off=(bar?bar.getBoundingClientRect().bottom:0)+8,t=s.getBoundingClientRect().top;
      if(t<off) window.scrollBy({top:t-off,behavior:'smooth'});
    },still?0:DUR);
  });
})();
