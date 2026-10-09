/* Ortak çerez tercihi (tüm sayfalar): Google Analytics yalnızca onayla yüklenir.
   Tercih localStorage 'cerez' anahtarında: '1' kabul, '0' ret. Altbilgideki .cerez-ac düğmesi uyarıyı yeniden açar.
   Head'de senkron yüklenir: gtag ve cerezOnay, sayfadaki diğer betiklerden önce hazır olur. */
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
(function(){
  var ID='G-P03FTPWL2F';
  function oku(){var c=null;try{c=localStorage.getItem('cerez')}catch(e){}return c}
  var c0=oku();
  window.cerezOnay=c0==='1';
  window['ga-disable-'+ID]=!window.cerezOnay;
  gtag('consent','default',{analytics_storage:window.cerezOnay?'granted':'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  gtag('js',new Date());gtag('config',ID);
  window.gaYukle=function(gecikme){if(window.gaYuklendi||!window.cerezOnay)return;window.gaYuklendi=1;setTimeout(function(){var s=document.createElement('script');s.async=1;s.src='https://www.googletagmanager.com/gtag/js?id='+ID;document.head.appendChild(s)},gecikme||0)};
  if(window.cerezOnay)addEventListener('load',function(){gaYukle(1500)});
  function gaSil(){var h=location.hostname,ds=['',h,'.'+h],p=h.split('.');if(p.length>2)ds.push('.'+p.slice(-2).join('.'));
    document.cookie.split(';').forEach(function(k){var n=k.split('=')[0].trim();if(/^(_ga|_gid|_gat)/.test(n))ds.forEach(function(dm){document.cookie=n+'=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'+(dm?'; domain='+dm:'')})})}
  if(c0!=='1')gaSil(); // onay yoksa eski _ga çerezlerini de temizle
  function basla(){
    var d=null,azHareket=matchMedia('(prefers-reduced-motion: reduce)').matches;
    function kaydet(v){try{localStorage.setItem('cerez',v)}catch(e){}}
    function kapat(){if(!d)return;var e=d;d=null;document.body.classList.remove('cerez-acik');
      if(azHareket){e.remove();return}e.classList.remove('gor');setTimeout(function(){e.remove()},750)}
    function sec(v){kaydet(v);kapat();
      if(v==='1'){window.cerezOnay=true;window['ga-disable-'+ID]=false;gtag('consent','update',{analytics_storage:'granted'});gaYukle(0)}
      else{var onceki=window.cerezOnay;window.cerezOnay=false;window['ga-disable-'+ID]=true;gtag('consent','update',{analytics_storage:'denied'});gaSil();if(onceki&&window.gaYuklendi)setTimeout(gaSil,500)}}
    function ac(tekrar){if(d)return;var c=oku();
      d=document.createElement('div');d.className='cerez';d.setAttribute('role','region');d.setAttribute('aria-label','Çerez tercihi');
      var durum=tekrar&&(c==='1'||c==='0')?' <span class="durum">(Şu anki tercihiniz: '+(c==='1'?'kabul':'ret')+'.)</span>':'';
      d.innerHTML='<div class="cerez-ic"><p>Hangi içeriklerin daha çok ilgi gördüğünü anlamak ve siteyi geliştirmek için, onayınızla Google Analytics çerezlerini kullanıyoruz. Tercihinizi dilediğiniz zaman değiştirebilirsiniz. <a href="/kvkk/#cerezler">Çerez politikası</a>'+durum+'</p><div class="cb"><button type="button" class="cr">Reddet</button><button type="button" class="ck">Kabul et</button></div></div>';
      document.body.appendChild(d);
      document.documentElement.style.setProperty('--cbh',d.offsetHeight+'px');
      void d.offsetHeight;d.classList.add('gor');document.body.classList.add('cerez-acik');
      d.querySelector('.ck').onclick=function(){sec('1')};d.querySelector('.cr').onclick=function(){sec('0')};
      if(tekrar)d.querySelector('.cr').focus({preventScroll:true})}
    addEventListener('resize',function(){if(d)document.documentElement.style.setProperty('--cbh',d.offsetHeight+'px')});
    document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('.cerez-ac');if(t)ac(true)});
    if(c0!=='1'&&c0!=='0')setTimeout(function(){var c1=oku();if(c1!=='1'&&c1!=='0')ac(false)},2500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',basla);else basla();
})();
