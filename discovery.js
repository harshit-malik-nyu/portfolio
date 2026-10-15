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
})();
