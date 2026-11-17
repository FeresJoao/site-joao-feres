import fs from 'node:fs/promises';
const read = name => fs.readFile('content/' + name + '.json', 'utf8').then(JSON.parse);
const [en, editorial, courses, publications, additions] = await Promise.all(['en','editorial','courses','publications','publication-additions'].map(read));
const routes = {index:'index',sobre:'about',publicacoes:'publications',pesquisa:'research',ensino:'teaching',contato:'contact',notas:'notes'};
const escape = text => String(text ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const decode = text => text.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const pubMap = new Map([...publications,...additions].map(p=>[p.id,p]));
const languages = {'Português':'pt-BR','Inglês':'en','Espanhol':'es','Francês':'fr','Alemão':'de','Bretão':'br'};
function translate(value) {
  if (en.strings[value] !== undefined) return en.strings[value];
  if (value.endsWith(' · João Feres Júnior')) return translate(value.slice(0,-' · João Feres Júnior'.length)) + ' · João Feres Júnior';
  if (value.endsWith(' ↓')) return translate(value.slice(0,-2)) + ' ↓';
  if (/^\d+ publicações(?: nesta seleção)?$/.test(value)) return value.replace('publicações nesta seleção','publications in this selection').replace('publicações','publications');
  if (/^\d{4} · [12]º sem(?:estre|\.)$/.test(value)) return value.replace('1º semestre','First semester').replace('2º semestre','Second semester').replace('1º sem.','First semester').replace('2º sem.','Second semester');
  if (value.includes(' · ')) return value.split(' · ').map(part => en.strings[part] ?? part.replace('IESP–UERJ e UFRGS','IESP–UERJ and UFRGS')).join(' · ');
  return value;
}
function translateText(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return raw;
  const value = decode(trimmed), translated = translate(value);
  if (translated === value) return raw;
  return raw.slice(0,raw.indexOf(trimmed)) + escape(translated).replaceAll('&amp;nbsp;','&nbsp;') + raw.slice(raw.indexOf(trimmed)+trimmed.length);
}
function originalLanguage(tag, lang='pt-BR') {
  return tag.replace(/^<([a-z0-9]+)([^>]*)>/i,(_,name,attrs)=>'<'+name+attrs.replace(/\s+lang="[^"]*"/g,'')+' lang="'+lang+'" data-original>');
}
const support = (title,course=false) => '<p class="title-translation" lang="en"><span class="translation-label">'+(course?'English title: ':'English rendering: ')+'</span>'+escape(title)+'</p>';
function englishMarkup(html) {
  const originals = [];
  const protect = fragment => { originals.push(fragment); return '<!--original-'+(originals.length-1)+'-->'; };
  html=html.replace(/<article class="catalogue-item"[\s\S]*?<\/article>/g,article=>{
    const id=decode(article.match(/\bid="pub-([^"]+)"/)[1]), pub=pubMap.get(id), title=en.publicationTitles[id];
    const lang=languages[pub?.language] || 'pt-BR';
    article=article.replace(/<h2[^>]*>[\s\S]*?<\/h2>/,heading=>protect(originalLanguage(heading,lang))+(title?support(title):''));
    article=article.replace(/<p class="catalogue-(?:authors|venue)"[^>]*>[\s\S]*?<\/p>/g,protect).replace(/<p data-citation>[\s\S]*?<\/p>/g,protect);
    article=article.replace(/data-search="([^"]+)"/,(_,value)=>{
      const search=normalize(decode(value));
      const aliases=Object.entries(en.searchAliases).filter(([key])=>new RegExp('(^|[^a-z])'+key+'([^a-z]|$)').test(search)).map(([,word])=>word).join(' ');
      return 'data-search="'+escape(decode(value)+' '+(title||'')+' '+aliases)+'"';
    });
    return article;
  });
  html=html.replace(/<a class="publication"[\s\S]*?<\/a>/g,article=>{
    const href=decode(article.match(/href="([^"]+)"/)[1]), pub=editorial.publications.find(p=>p.url===href), title=en.publicationTitles[pub?.id];
    article=article.replace(/<h3[^>]*>[\s\S]*?<\/h3>/,heading=>protect(originalLanguage(heading,languages[pub?.language]||'pt-BR'))+(title?support(title):''));
    return article.replace(/<p class="pub-(?:authors|venue)"[^>]*>[\s\S]*?<\/p>/g,protect);
  });
  // Original book and course titles are preserved; English renderings are supporting text.
  html=html.replace(/<h1[^>]*>Nas ruas<br>e fora delas<\/h1>/,heading=>protect(originalLanguage(heading)));
  html=html.replace(/<p class="subtitle">Junho de 2013 revisitado<\/p>/,subtitle=>protect(originalLanguage(subtitle))+support(en.publicationTitles['nas-ruas-2026']));
  html=html.replace(/<h2 id="livro-title">[\s\S]*?<\/h2>/,heading=>protect(originalLanguage(heading)));
  html=html.replace(/<p class="book-detail-subtitle">[\s\S]*?<\/p>/,subtitle=>protect(originalLanguage(subtitle))+support(en.publicationTitles['nas-ruas-2026']));
  html=html.replace(/<div class="course-archive">([\s\S]*?)<\/div><\/section>/,(block)=>{
    return block.replace(/<article id="([^"]+)">[\s\S]*?<\/article>/g,(article,id)=>article.replace(/<h3>[\s\S]*?<\/h3>/,heading=>protect(originalLanguage(heading))+(en.courseTitles[id]?support(en.courseTitles[id],true):'')));
  });
  html=html.replace(/<ul class="course-list">[\s\S]*?<\/ul>/,()=>'<ul class="course-list">'+editorial.courses.map(c=>{
    const id=c.url.split('#')[1], title=en.courseTitles[id];
    return '<li><a href="'+escape(c.url)+'">'+protect('<span class="original-course-title" lang="pt-BR">'+escape(c.title)+'</span>')+(title?'<small class="course-title-translation" lang="en">English title: '+escape(title)+'</small>':'')+' <span aria-hidden="true">→</span></a><span>'+translate(c.term)+'</span></li>';
  }).join('')+'</ul>');
  html=html.replace(/(<[^>]+>)|([^<]+)/g,(whole,tag,text)=>{
    if(text!==undefined) return translateText(text);
    return tag.replace(/\b(alt|aria-label|placeholder|content)="([^"]*)"/g,(_,attr,value)=>attr+'="'+escape(translate(decode(value)))+'"');
  });
  html=html.replace(/<!--original-(\d+)-->/g,(_,i)=>originals[Number(i)]);
  html=html.replace('<html lang="pt-BR">','<html lang="en">');
  html=html.replace(/(href|src)="([^"]+)"/g,(_,attr,value)=>{
    if(/^(?:https?:|mailto:|#)/.test(value))return attr+'="'+value+'"';
    const m=value.match(/^([^?#]+)(.*)$/),file=m[1],suffix=m[2],slug=file.replace(/\.html$/,'');
    let target=routes[slug]?routes[slug]+'.html':'../'+file;
    if(file==='assets/minibio-joao-feres.txt')target='../assets/minibio-joao-feres-en.txt';
    return attr+'="'+target+suffix+'"';
  });
  html=html.replace('subject=Contato%20acad%C3%AAmico','subject=Academic%20inquiry').replace('subject=Solicita%C3%A7%C3%A3o%20de%20entrevista','subject=Interview%20request');
  if(html.includes('data-catalogue'))html=html.replace('<div class="catalogue-jump">','<p class="translation-note">Publication titles and citations retain their original wording. Selected titles include English renderings for reference.</p><div class="catalogue-jump">');
  return html;
}
function languageNavigation(html,slug,english) {
  const pt=english?'../'+slug+'.html':slug+'.html', eng=english?routes[slug]+'.html':'en/'+routes[slug]+'.html';
  const selector='<nav class="language-switch" aria-label="'+(english?'Language':'Idioma')+'"><a data-language-switch href="'+pt+'" lang="pt-BR" hreflang="pt-BR" aria-label="Português"'+(!english?' aria-current="true"':'')+'>PT</a><a data-language-switch href="'+eng+'" lang="en" hreflang="en" aria-label="English"'+(english?' aria-current="true"':'')+'>EN</a></nav>';
  html=html.replace(/<button class="menu-toggle"[\s\S]*?<\/button>/,button=>'<div class="header-controls">'+selector+button+'</div>');
  const alternates='<link rel="alternate" hreflang="pt-BR" href="'+pt+'"><link rel="alternate" hreflang="en" href="'+eng+'">';
  return html.replace('</head>',alternates+'</head>');
}
await fs.mkdir('dist/en',{recursive:true});
for(const [slug,englishSlug] of Object.entries(routes)){
  let pt=await fs.readFile('dist/'+slug+'.html','utf8');
  const english=languageNavigation(englishMarkup(pt),slug,true);
  if(slug==='publicacoes'){
    const indexes=new Map([...english.matchAll(/<article class="catalogue-item"[^>]*>/g)].map(([tag])=>[tag.match(/id="([^"]+)"/)[1],tag.match(/data-search="([^"]*)"/)[1]]));
    pt=pt.replace(/<article class="catalogue-item"[^>]*>/g,tag=>tag.replace(/data-search="[^"]*"/,()=> 'data-search="'+indexes.get(tag.match(/id="([^"]+)"/)[1])+'"'));
  }
  await fs.writeFile('dist/en/'+englishSlug+'.html',english);
  await fs.writeFile('dist/'+slug+'.html',languageNavigation(pt,slug,false));
}
await fs.writeFile('dist/assets/minibio-joao-feres-en.txt',en.shortBio+'\n\nContact: '+editorial.profile.email+'\nSource: author-supplied Lattes CV, updated 16 November 2026; book details from Autêntica; INCT ID-ICED website.\n');
console.log('7 English pages generated; PT/EN navigation added to all 14 current pages.');
