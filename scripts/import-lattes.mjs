// Extração por lista explícita de campos acadêmicos. O XML não é copiado para dist.
import fs from 'node:fs/promises';
const input=process.argv[2]||'../4890516395721831.xml';
const xml=(await fs.readFile(input)).toString('latin1');
const decode=s=>s.replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/\u0092/g,'’').replace(/\u0093/g,'“').replace(/\u0094/g,'”').replace(/\u0096/g,'–').replace(/\u0097/g,'—');
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
const tags=tag=>[...xml.matchAll(new RegExp('<'+tag+'\\b([^>]*)(?:>([\\s\\S]*?)</'+tag+'>|/>)','g'))];
const spec=[['article','ARTIGO-PUBLICADO','DADOS-BASICOS-DO-ARTIGO','DETALHAMENTO-DO-ARTIGO','TITULO-DO-ARTIGO','ANO-DO-ARTIGO','articles'],['book','LIVRO-PUBLICADO-OU-ORGANIZADO','DADOS-BASICOS-DO-LIVRO','DETALHAMENTO-DO-LIVRO','TITULO-DO-LIVRO','ANO','books'],['chapter','CAPITULO-DE-LIVRO-PUBLICADO','DADOS-BASICOS-DO-CAPITULO','DETALHAMENTO-DO-CAPITULO','TITULO-DO-CAPITULO-DO-LIVRO','ANO','chapters']];
const records=spec.flatMap(([type,tag,basic,detail,title,year,prefix])=>tags(tag).map(m=>{const b=attrs(m[2].match(new RegExp('<'+basic+'\\b([^>]*)'))?.[1]||'');const d=attrs(m[2].match(new RegExp('<'+detail+'\\b([^>]*)'))?.[1]||'');const doi=b.DOI?.trim()||null;const homepage=b['HOME-PAGE-DO-TRABALHO']||'';const explicitUrl=homepage.match(/https?:\/\/[^\]\s]+/)?.[0]||null;const start=d['PAGINA-INICIAL']||'';const end=d['PAGINA-FINAL']||'';return{id:prefix+'-'+attrs(m[1])['SEQUENCIA-PRODUCAO'],type,title:b[title],year:Number(b[year]),authors:[...m[2].matchAll(/<AUTORES\b([^>]*)/g)].map(x=>attrs(x[1])['NOME-COMPLETO-DO-AUTOR']),venue:d['TITULO-DO-PERIODICO-OU-REVISTA']||d['NOME-DA-EDITORA']||'',containerTitle:type==='chapter'?d['TITULO-DO-LIVRO']||'':null,publisher:d['NOME-DA-EDITORA']||null,organizers:d.ORGANIZADORES||null,edition:d['NUMERO-DA-EDICAO-REVISAO']||null,bookKind:b.TIPO||null,location:d['CIDADE-DA-EDITORA']||null,isbn:d.ISBN||null,volume:d.VOLUME||null,pages:/^e\d/i.test(start)?start:[start,end&&end!==start?end:''].filter(Boolean).join('–'),pageCount:d['NUMERO-DE-PAGINAS']?Number(d['NUMERO-DE-PAGINAS']):null,language:b.IDIOMA||null,doi,url:explicitUrl||(doi?'https://doi.org/'+doi:null),source:'Lattes fornecido pelo autor · 16/11/2026',published:true}}));
// Ajustes editoriais são mantidos fora da importação para não serem perdidos.
const corrections=JSON.parse(await fs.readFile('content/publication-overrides.json','utf8'));
const curated=records.map(record=>({...record,...(corrections[record.id]||{})}));
const editorial=JSON.parse(await fs.readFile('content/editorial.json','utf8'));
curated.unshift({...editorial.book,language:'Português',pageCount:editorial.book.pages,pages:'',published:true,source:'Autêntica · página oficial do livro'});
await fs.writeFile('content/publications.json',JSON.stringify(curated,null,2)+'\n');
console.log(`${curated.length} registros acadêmicos extraídos; ${curated.filter(x=>x.published).length} disponíveis no catálogo.`);
