(()=>{
  const catalogue=document.querySelector('[data-catalogue]');if(!catalogue)return;
  const english=document.documentElement.lang==='en';
  const form=catalogue.querySelector('form'),search=form.elements.q,type=form.elements.tipo,year=form.elements.ano;
  const items=[...catalogue.querySelectorAll('.catalogue-item')],count=catalogue.querySelector('#result-count'),more=catalogue.querySelector('#load-more'),empty=catalogue.querySelector('.empty-results');
  const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const indexed=items.map(el=>({el,search:normalize(el.dataset.search)}));
  let limit=12;
  function update(reset=true){
    if(reset)limit=12;
    const terms=normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    const matches=indexed.filter(({el,search:haystack})=>(type.value==='all'||el.dataset.type===type.value)&&(year.value==='all'||el.dataset.year===year.value)&&terms.every(t=>haystack.includes(t)));
    items.forEach(el=>{el.hidden=true});matches.slice(0,limit).forEach(({el})=>{el.hidden=false});
    count.textContent=english?(matches.length===0?'No publications found':`${Math.min(limit,matches.length)} of ${matches.length} ${matches.length===1?'publication':'publications'}`):(matches.length===0?'Nenhuma publicação encontrada':`${Math.min(limit,matches.length)} de ${matches.length} ${matches.length===1?'publicação':'publicações'}`);
    empty.hidden=matches.length!==0;more.hidden=matches.length<=limit;
    const query=new URLSearchParams();if(search.value.trim())query.set('q',search.value.trim());if(type.value!=='all')query.set('tipo',type.value);if(year.value!=='all')query.set('ano',year.value);
    try{history.replaceState(null,'',location.pathname+(query.size?'?'+query:'')+location.hash)}catch{/* Arquivos locais mantêm a busca funcional sem alterar a URL. */}
  }
  const initial=new URLSearchParams(location.search);search.value=initial.get('q')||'';
  for(const [select,key] of [[type,'tipo'],[year,'ano']])if([...select.options].some(o=>o.value===initial.get(key)))select.value=initial.get(key);
  form.hidden=false;form.addEventListener('submit',event=>{event.preventDefault();update()});search.addEventListener('input',()=>update());type.addEventListener('change',()=>update());year.addEventListener('change',()=>update());
  function clear(){search.value='';type.value='all';year.value='all';update()}
  form.addEventListener('reset',event=>{event.preventDefault();clear()});catalogue.querySelector('[data-clear-catalogue]').addEventListener('click',()=>{clear();search.focus()});
  more.addEventListener('click',()=>{const oldLimit=limit;limit+=12;update(false);const shown=items.filter(el=>!el.hidden);const firstNew=shown[oldLimit];if(firstNew){firstNew.tabIndex=-1;firstNew.focus({preventScroll:true})}});
  update();
})();
