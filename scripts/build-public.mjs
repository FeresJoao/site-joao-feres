import fs from 'node:fs/promises';
import path from 'node:path';

// A prévia completa continua em dist; somente esta seleção será publicada.
await import('./build.mjs');

const output = path.resolve('_site');
const routes = {index:'index',sobre:'about',publicacoes:'publications',pesquisa:'research',ensino:'teaching',contato:'contact',notas:'notes'};
const configuredUrl = new URL(process.env.SITE_URL || 'https://joao.lemep.net.br/');
if (!['http:', 'https:'].includes(configuredUrl.protocol) || configuredUrl.username || configuredUrl.password || configuredUrl.search || configuredUrl.hash) {
  throw new Error('SITE_URL deve ser uma URL HTTP(S) pública, sem credenciais, consulta ou fragmento.');
}
// O Pages pode informar HTTP enquanto o certificado do domínio é emitido.
configuredUrl.protocol = 'https:';
const baseUrl = configuredUrl.href.replace(/\/?$/, '/');
const url = file => new URL(file === 'index.html' ? '' : file === 'en/index.html' ? 'en/' : file, baseUrl).href;
const xml = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
// O caminho é fixo e conferido antes da limpeza; dist e conteúdo nunca são apagados.
if (output !== path.join(process.cwd(), '_site')) throw new Error('Diretório de saída inesperado.');
await fs.rm(output, {recursive:true,force:true});
await fs.mkdir(path.join(output, 'en'), {recursive:true});
await fs.mkdir(path.join(output, 'assets'), {recursive:true});

const sitemap = [];
for (const [pt, en] of Object.entries(routes)) {
  const ptFile = pt + '.html', enFile = 'en/' + en + '.html';
  for (const file of [ptFile, enFile]) {
    let html = await fs.readFile(path.join('dist', file), 'utf8');
    html = html.replace(/<meta name="robots" content="[^"]*">/g, '<meta name="robots" content="index,follow">');
    // O link às propostas de revisão fica disponível apenas na prévia local.
    html = html.replace(/\s*<a\b[^>]*href="(?:\.\.\/)?comparar\.html"[^>]*>[\s\S]*?<\/a>/g, '');
    html = html.replace(/<link rel="alternate" hreflang="([^"]+)" href="[^"]*">/g, (_, lang) =>
      '<link rel="alternate" hreflang="' + lang + '" href="' + xml(url(lang === 'en' ? enFile : ptFile)) + '">');
    html = html.replace('</head>', '<link rel="canonical" href="' + xml(url(file)) + '"></head>');
    await fs.writeFile(path.join(output, file), html);
    sitemap.push('<url><loc>' + xml(url(file)) + '</loc><xhtml:link rel="alternate" hreflang="pt-BR" href="' + xml(url(ptFile)) + '"/><xhtml:link rel="alternate" hreflang="en" href="' + xml(url(enFile)) + '"/></url>');
  }
}
const assets = ['styles.css','pages.css','site.js','catalogue.js','assets/joao-feres-atual.png','assets/nas-ruas-e-fora-delas.jpg','assets/minibio-joao-feres.txt','assets/minibio-joao-feres-en.txt'];
for (const file of assets) await fs.copyFile(path.join('dist', file), path.join(output, file));
await fs.writeFile(path.join(output, '.nojekyll'), '');
await fs.writeFile(path.join(output, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: ' + new URL('sitemap.xml', baseUrl).href + '\n');
await fs.writeFile(path.join(output, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + sitemap.join('\n') + '\n</urlset>\n');
console.log('Publicação preparada em _site: 14 páginas PT/EN. Endereço: ' + baseUrl);
