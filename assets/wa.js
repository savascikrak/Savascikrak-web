/* Yuzen WhatsApp dugmesi - tum sayfalar (egitim sayfasindaki .wa-float ile ayni yer/olcu). Sayfada zaten varsa eklemez. */
(function(){
if(document.querySelector('.wa-float'))return;
var s=document.createElement('style');
s.textContent='.wa-float{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:40;display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:#0F6B3D;color:#fff;text-decoration:none;box-shadow:0 8px 24px rgba(0,0,0,.22);transition:transform .2s ease,background .2s ease}.wa-float svg{width:30px;height:30px}.wa-float:hover{background:#13804A;color:#fff;transform:scale(1.06)}@media (min-width:900px){.wa-float{width:60px;height:60px;right:28px;bottom:28px}}@media print{.wa-float{display:none}}';
document.head.appendChild(s);
var a=document.createElement('a');
a.className='wa-float';
a.href='https://wa.me/905310317444?text='+encodeURIComponent('Merhaba, sitenizden ulaşıyorum.');
a.target='_blank';a.rel='noopener';
a.setAttribute('aria-label',"WhatsApp'tan yazın");
a.innerHTML="<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" fill=\"currentColor\"><path d=\"M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.6c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A7.9 7.9 0 1 1 12 19.8zm4.4-5.9c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.1 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2l-.6-.6z\"/></svg>";
document.body.appendChild(a);
})();
