(function(){
'use strict';
function node(tag,text){const n=document.createElement(tag);n.textContent=text;return n;}
const search=document.getElementById('project-search'),results=document.getElementById('project-results'),count=document.getElementById('search-count');
const studies=[...document.querySelectorAll('article.project[id]')].map(article=>({id:article.id,title:article.querySelector('h2')?.textContent||article.id,text:article.textContent.toLowerCase()}));
search.addEventListener('input',()=>{
  const query=search.value.trim().toLowerCase();results.replaceChildren();results.hidden=!query;
  if(!query){count.textContent='';return;}
  const terms=query.split(/\s+/);const matches=studies.filter(s=>terms.every(t=>s.text.includes(t)));
  count.textContent=matches.length?`${matches.length} matching ${matches.length===1?'study':'studies'}`:'No matching studies. Try a broader topic or explore the three selected projects below.';
  for(const study of matches){const link=node('a',study.title);link.href='#'+study.id;link.addEventListener('click',()=>{const target=document.getElementById(study.id);for(let p=target.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;target.tabIndex=-1;target.focus({preventScroll:true});});const li=node('li','');li.append(link);results.append(li);}
});
// Discover live availability; no model request is made on page load.
const section=document.getElementById('ai-assistant'),form=document.getElementById('ai-form'),output=document.getElementById('ai-result'),submit=document.getElementById('ai-submit'),cancel=document.getElementById('ai-cancel');let active=null;
fetch('/api/portfolio-agent',{signal:AbortSignal.timeout(4000)}).then(r=>r.ok?r.json():{}).then(s=>{section.hidden=s.available!==true;}).catch(()=>{});
cancel.addEventListener('click',()=>active?.abort());
form.addEventListener('submit',async event=>{
  event.preventDefault();if(active)return;active=new AbortController();const controller=active;const timer=setTimeout(()=>controller.abort(),65000);submit.disabled=true;cancel.hidden=false;output.replaceChildren(node('p','Reviewing the evidence and running relevant tools…'));output.setAttribute('aria-busy','true');
  try{
    const r=await fetch('/api/portfolio-agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:document.getElementById('ai-question').value}),signal:controller.signal});const data=await r.json();if(!r.ok)throw Error(data.error||'AI review unavailable.');
    output.replaceChildren(node('p',data.answer));const list=node('ul','');
    for(const source of data.sources){if(typeof source.url!=='string'||!source.url.startsWith('/')||source.url.startsWith('//'))continue;const a=node('a',source.title);a.href=source.url;const li=node('li','');li.append(a);list.append(li);}output.append(list,node('p',data.limitation));
    const details=node('details','');details.append(node('summary','Inspect tools and results'));for(const step of data.trace){details.append(node('h4',step.tool),node('pre',JSON.stringify(step.result,null,2)));}output.append(details);
  }catch(error){output.replaceChildren(node('p',error.name==='AbortError'?'Review cancelled or timed out. You can retry or browse the work samples.':error.message));}
  finally{clearTimeout(timer);active=null;submit.disabled=false;cancel.hidden=true;output.removeAttribute('aria-busy');}
});
})();
