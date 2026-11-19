# Publicação e manutenção

Repositório: https://github.com/FeresJoao/site-joao-feres

Endereço inicial do GitHub Pages: https://feresjoao.github.io/site-joao-feres/

Depois de cadastrar o domínio personalizado, o endereço inicial redireciona para ele; o DNS precisa estar configurado para o acesso funcionar.

Endereço personalizado cadastrado no GitHub: https://joao.lemep.net.br/

## Atualizar o site

Edite os arquivos de content/ conforme CONTEUDO.md. Para gerar e conferir a prévia local:

    node scripts/build.mjs
    node scripts/check.mjs

Envie as alterações ao branch main. O GitHub Actions executa a geração, confere links e correspondência entre idiomas e publica apenas a pasta _site. Não há dependências npm a instalar. Uma falha na verificação impede a publicação e mantém a versão anterior. Acompanhe a aba Actions do repositório.

A pasta dist contém também as propostas de revisão. A pasta _site é gerada por scripts/build-public.mjs com uma lista explícita de páginas e arquivos públicos: 16 páginas PT/EN, imagens, biografias e os CSS/JS utilizados. Propostas antigas, fontes originais, relatórios locais e XML do Lattes ficam fora da publicação.

## Endereço personalizado

O endereço joao.lemep.net.br foi cadastrado em Settings → Pages → Custom domain. O autor configurou a entrada abaixo no Registro.br em 17/11/2026; ela foi confirmada no servidor autoritativo e nos resolvedores públicos do Google e da Cloudflare. Para manutenção, a configuração está em Registro.br → lemep.net.br → DNS → Configurar zona DNS:

| Tipo | Nome | Destino |
| --- | --- | --- |
| CNAME | joao | feresjoao.github.io |

O destino não contém https:// nem o nome do repositório. Preserve os registros existentes do domínio. Se já houver registros para joao, confira seu uso antes de modificá-los.

O certificado HTTPS é emitido automaticamente pelo GitHub após sua validação interna do DNS. Quando o certificado estiver disponível, mantenha Enforce HTTPS ativo. Execute novamente o workflow para atualizar os endereços canônicos e o sitemap. A geração utiliza a URL retornada por actions/configure-pages, funcionando tanto no endereço inicial quanto no domínio personalizado. O workflow usa publicação por Actions; um arquivo CNAME não substitui a configuração de Custom domain no GitHub.

O acesso ao Registro.br deve ser feito pelo titular ou administrador autorizado. Não guarde senhas ou tokens neste repositório.

## Conferir uma publicação localmente

    node scripts/build-public.mjs
    node scripts/check.mjs _site --public

Sem SITE_URL, a geração considera https://joao.lemep.net.br/. No GitHub, SITE_URL é definido automaticamente. A versão pública permite indexação por mecanismos de busca e inclui URLs canônicas, alternância de idiomas, robots.txt e sitemap.xml. A prévia em dist permanece fora da indexação.

Referências: [workflows do Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [domínio personalizado](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
