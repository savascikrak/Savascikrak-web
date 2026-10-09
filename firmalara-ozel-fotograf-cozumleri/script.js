/* Kaydirinca beliren bloklar (egitim sayfasiyla ayni) */
(function(){
  if(!('IntersectionObserver' in window)) return;
  if(matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  var sec='.program-intro,.fx-tl-item,.campaign-card,.fx-sectors,.price-box,.faq-col';
  var el=[].slice.call(document.querySelectorAll(sec));
  var io=new IntersectionObserver(function(en){en.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); } });},{rootMargin:'0px 0px -8% 0px',threshold:.08});
  el.forEach(function(x){
    if(x.getBoundingClientRect().top < innerHeight) return;
    var kar=[].slice.call(x.parentNode.children).filter(function(c){return c.matches(sec)});
    var i=kar.indexOf(x); if(i>0) x.style.transitionDelay=Math.min(i,5)*90+'ms';
    x.classList.add('rv'); io.observe(x);
  });
})();
