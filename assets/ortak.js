/* Ortak ust bar + mobil menu (tum sayfalar) */
(function(){
var u=document.getElementById('ub'),d=document.getElementById('ub-cek'),ac=document.getElementById('ub-ac'),kp=document.getElementById('ub-kapa');if(!u)return;
var sc=function(){u.classList.toggle('ub-k',scrollY>40)};sc();addEventListener('scroll',sc,{passive:true});
if(document.body.dataset.ub!=='seffaf')document.documentElement.style.scrollPaddingTop='76px';
var set=function(o){d.classList.toggle('ub-acik',o);d.setAttribute('aria-hidden',!o);ac.setAttribute('aria-expanded',o);document.body.classList.toggle('ub-kilit',o);if(o)kp.focus();else ac.focus({preventScroll:true})};
ac.addEventListener('click',function(){set(true)});kp.addEventListener('click',function(){set(false)});
d.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){d.classList.remove('ub-acik');d.setAttribute('aria-hidden','true');ac.setAttribute('aria-expanded','false');document.body.classList.remove('ub-kilit')})});
addEventListener('keydown',function(e){if(e.key==='Escape'&&d.classList.contains('ub-acik'))set(false)});
})();
