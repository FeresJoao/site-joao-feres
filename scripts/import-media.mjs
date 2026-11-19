// Importa somente campos públicos de participações e textos na imprensa.
import fs from 'node:fs/promises';
const input = process.argv[2] || '../4890516395721831.xml';
const xml = new TextDecoder('windows-1252').decode(await fs.readFile(input));
const decode = value => value.replace(/&amp;/g,'&').replace(/&#x([0-9a-f]+);/gi, (_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').trim();
const attrs = value => Object.fromEntries([...value.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
const fields = (block,tag) => attrs(block.match(new RegExp('<'+tag+'\\b([^>]*)'))?.[1] || '');
const specs = [
  ['appearance','PROGRAMA-DE-RADIO-OU-TV','DADOS-BASICOS-DO-PROGRAMA-DE-RADIO-OU-TV','DETALHAMENTO-DO-PROGRAMA-DE-RADIO-OU-TV'],
  ['press','TEXTO-EM-JORNAL-OU-REVISTA','DADOS-BASICOS-DO-TEXTO','DETALHAMENTO-DO-TEXTO']
];
function safeUrl(value) {
  let candidate = (value || '').replace(/^\[|\]$/g,'').trim();
  if (/^(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}\//i.test(candidate)) candidate='https://'+candidate;
  try {
    const url = new URL(candidate);
    if (!['http:','https:'].includes(url.protocol) || url.username || url.password) return null;
    // Retira parâmetros de rastreamento e identificadores de assinantes.
    for (const key of [...url.searchParams.keys()]) if (/^utm_|^(fbclid|gclid|mc_cid|mc_eid)$/i.test(key) || (url.hostname==='mailchi.mp' && key==='e')) url.searchParams.delete(key);
    return url.href;
  } catch { return null; }
}
function dateValue(raw,year) {
  if (!/^\d{8}$/.test(raw||'')) return null;
  const d=raw.slice(0,2),m=raw.slice(2,4),y=raw.slice(4), iso=y+'-'+m+'-'+d;
  const parsed=new Date(iso+'T12:00:00Z');
  return +y===year && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10)===iso ? iso : null;
}
const records=specs.flatMap(([group,tag,basic,detail])=>[...xml.matchAll(new RegExp('<'+tag+'\\b([^>]*)>([\\s\\S]*?)</'+tag+'>','g'))].map(m=>{
  const b=fields(m[2],basic),d=fields(m[2],detail),isPress=group==='press';
  const title=b[isPress?'TITULO-DO-TEXTO':'TITULO'],year=Number(b[isPress?'ANO-DO-TEXTO':'ANO']);
  const venue=d[isPress?'TITULO-DO-JORNAL-OU-REVISTA':'EMISSORA']||null;
  const type=isPress?'press':/podcast/i.test(title+' '+venue)?'podcast':({ENTREVISTA:'interview',COMENTARIO:'commentary',MESA_REDONDA:'debate',PROGRAMA:'programme'}[b.NATUREZA]||'other');
  return {id:group+'-'+attrs(m[1])['SEQUENCIA-PRODUCAO'],group,type,title,year,date:dateValue(d[isPress?'DATA-DE-PUBLICACAO':'DATA-DA-APRESENTACAO'],year),venue,authors:isPress?[...m[2].matchAll(/<AUTORES\b([^>]*)/g)].map(x=>attrs(x[1])['NOME-COMPLETO-DO-AUTOR']):[],language:b.IDIOMA||null,url:safeUrl(b[isPress?'HOME-PAGE-DO-TRABALHO':'HOME-PAGE']),published:true};
}));
const overrides=JSON.parse(await fs.readFile('content/media-overrides.json','utf8'));
const curated=records.map(record=>({...record,...(overrides[record.id]||{})}));
if (new Set(curated.map(x=>x.id)).size!==curated.length || curated.some(x=>!x.title || !Number.isInteger(x.year))) throw new Error('Registro de mídia sem identificação, título ou ano válido.');
await fs.writeFile('content/media.json',JSON.stringify(curated,null,2)+'\n');
console.log(JSON.stringify({records:curated.length,appearances:curated.filter(x=>x.group==='appearance').length,press:curated.filter(x=>x.group==='press').length,withoutUrl:curated.filter(x=>!x.url).length,withoutDate:curated.filter(x=>!x.date).length,withoutVenue:curated.filter(x=>!x.venue).length}));
