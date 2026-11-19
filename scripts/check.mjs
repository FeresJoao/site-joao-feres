import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.argv[2] || 'dist');
const publicBuild=process.argv.includes('--public');
const routes={index:'index',sobre:'about',publicacoes:'publications',pesquisa:'research',ensino:'teaching',midia:'media',contato:'contact',notas:'notes'};
const files=[];
async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())await walk(file);else if(entry.name.endsWith('.html'))files.push(file)}}
await walk(root);
const failures=[];let total=0;
const isEnglishPage=file=>path.relative(root,file).startsWith('en'+path.sep);
const cache=new Map(await Promise.all(files.map(async file=>[file,await fs.readFile(file,'utf8')])));
if(publicBuild){
  if(files.length!==Object.keys(routes).length*2)failures.push('Public build must contain all current PT/EN HTML pages');
  for(const [file,html] of cache){
    const name=path.relative(root,file);
    if(/noindex|comparar\.html|versao-[12]\.html|class="review-link"/.test(html))failures.push(name+': preview content in public build');
    const canonical=html.match(/<link rel="canonical" href="([^"]+)">/);
    if(!canonical || !canonical[1].startsWith('https://'))failures.push(name+': missing HTTPS canonical URL');
  }
  for(const file of ['.nojekyll','robots.txt','sitemap.xml']){
    try{await fs.access(path.join(root,file))}catch{failures.push('Missing public file: '+file)}
  }
}
for(const [file,html] of cache){
  const name=path.relative(root,file),isEnglish=name.startsWith('en'+path.sep);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  if(ids.length!==new Set(ids).size)failures.push(name+': duplicate IDs');
  if(!html.includes('<html lang="'+(isEnglish?'en':'pt-BR')+'">'))failures.push(name+': incorrect document language');
  for(const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^(https?:|mailto:)/.test(raw))continue;
    const [filePart,hash]=raw.split('#'),relative=filePart.split('?')[0];
    const target=relative?path.resolve(path.dirname(file),relative):file;
    if(!target.startsWith(root+path.sep)){failures.push(name+': link leaves dist: '+raw);continue}
    try{await fs.access(target);if(hash){const destination=cache.get(target)??await fs.readFile(target,'utf8');if(!destination.includes('id="'+hash+'"'))failures.push(name+': missing anchor '+raw)}total++}
    catch{failures.push(name+': missing file '+raw)}
  }
}
for(const [pt,en] of Object.entries(routes)){
  const left=cache.get(path.join(root,pt+'.html')),right=cache.get(path.join(root,'en',en+'.html'));
  if(!right){failures.push('Missing English page: '+en);continue}
  for(const [label,html] of [['PT',left],['EN',right]]){
    if((html.match(/data-language-switch/g)||[]).length!==2)failures.push(pt+': missing '+label+' language navigation');
    if(!html.includes('hreflang="pt-BR"')||!html.includes('hreflang="en"'))failures.push(pt+': missing alternate languages');
  }
  if(pt==='publicacoes'){
    const ids=html=>[...html.matchAll(/id="pub-([^"]+)"/g)].map(m=>m[1]);
    const citations=html=>[...html.matchAll(/<p data-citation>([\s\S]*?)<\/p>/g)].map(m=>m[1]);
    if(JSON.stringify(ids(left))!==JSON.stringify(ids(right)))failures.push('Publication records differ between languages');
    if(JSON.stringify(citations(left))!==JSON.stringify(citations(right)))failures.push('Original citations changed in translation');
    const indexes=html=>[...html.matchAll(/data-search="([^"]*)"/g)].map(m=>m[1]);
    if(JSON.stringify(indexes(left))!==JSON.stringify(indexes(right)))failures.push('Search indexes differ between languages');
  }
  if(pt==='midia'){
    const records=JSON.parse(await fs.readFile('content/media.json','utf8'));
    const additions=JSON.parse(await fs.readFile('content/media-additions.json','utf8'));
    const expected=[...new Map([...records,...additions].map(x=>[x.id,x])).values()].filter(x=>x.published!==false);
    const ids=html=>[...html.matchAll(/<article class="catalogue-item media-item" id="media-([^"]+)"/g)].map(m=>m[1]);
    if(JSON.stringify(ids(left))!==JSON.stringify(ids(right)))failures.push('Media records differ between languages');
    if(ids(left).length!==expected.length || expected.some(x=>!ids(left).includes(x.id)))failures.push('Media archive omits or repeats source records');
    const titles=html=>[...html.matchAll(/<h2 lang="[^"]+">([\s\S]*?)<\/h2>/g)].map(m=>m[1]);
    if(JSON.stringify(titles(left))!==JSON.stringify(titles(right)))failures.push('Media titles changed in translation');
    for(const x of expected){
      if(x.url && (!/^https?:\/\//.test(x.url) || new URL(x.url).username || new URL(x.url).password))failures.push('Invalid media URL: '+x.id);
      if(x.date && (+x.date.slice(0,4)!==x.year || new Date(x.date).toISOString().slice(0,10)!==x.date))failures.push('Invalid media date: '+x.id);
      if(/[\u0080-\u009f]|&(?:amp|quot);/.test(x.title+' '+x.venue))failures.push('Undecoded media text: '+x.id);
    }
    for(const [file,html] of cache)if(!/versao-|comparar/.test(file) && !html.includes(isEnglishPage(file)?'href="media.html"':'href="midia.html"'))failures.push('Missing media navigation: '+file);
  }
  if(pt==='ensino'){
    const ids=html=>[...html.matchAll(/<article id="([^"]+)"/g)].map(m=>m[1]);
    if(JSON.stringify(ids(left))!==JSON.stringify(ids(right)))failures.push('Course records differ between languages');
  }
}
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(files.length+' HTML pages and '+total+' local references verified. PT/EN page pairs, original citations and course/publication records match.');
