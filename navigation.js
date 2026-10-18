// Progressive mobile navigation: direct links remain usable without JavaScript.
(()=>{
const button=document.getElementById('nav-toggle'),nav=document.getElementById('main-navigation');if(!button||!nav)return;
button.hidden=false;document.body.classList.add('nav-enhanced');
function setOpen(open){button.setAttribute('aria-expanded',String(open));button.firstChild.textContent=open?'Close ':'Menu ';button.querySelector('span').textContent=open?'−':'＋';nav.classList.toggle('is-open',open);}
button.addEventListener('click',()=>setOpen(button.getAttribute('aria-expanded')!=='true'));
nav.addEventListener('click',event=>{if(event.target.closest('a'))setOpen(false);},true);
document.querySelector('.masthead').addEventListener('keydown',event=>{if(event.key==='Escape'&&button.getAttribute('aria-expanded')==='true'){setOpen(false);button.focus();}});
})();
