# João Feres Júnior — site pessoal e acadêmico

A página inicial adota a versão 1, escolhida pelo autor, com o livro Nas ruas e fora delas em destaque.

## Como abrir

Dê duplo clique em dist/index.html para abrir a página principal no navegador. O site usa arquivos estáticos e caminhos relativos. Os links para DOI, editoras e instituições precisam de conexão à internet.

Páginas: index.html, sobre.html, publicacoes.html, pesquisa.html, ensino.html, midia.html e contato.html. Fontes e lacunas: notas.html. As duas propostas originais continuam em comparar.html.

Para abrir por HTTP local, com Node.js:

    npm start

Acesse http://localhost:4173. Para regenerar as páginas após alterar os dados:

    npm run build
    npm run check

## Acrescentar conteúdo

Consulte CONTEUDO.md para exemplos. Os arquivos JSON usam UTF-8.

- content/editorial.json: perfil curto, livro em destaque e seleção de publicações da inicial.
- content/profile.json: biografia, formação e apresentação em inglês.
- content/publications.json: catálogo importado e corrigido.
- content/publication-additions.json: novos trabalhos incluídos manualmente, preservados nas futuras importações.
- content/publication-overrides.json: correções por identificador aplicadas ao importar o XML.
- content/projects.json: grupos e projetos selecionados.
- content/courses.json: disciplinas e cursos.
- content/media.json: entrevistas, participações e textos na imprensa importados do Lattes.
- content/media-additions.json e content/media-overrides.json: novos registros e correções preservados na importação.

A busca, filtros por tipo e ano, cópia de referências e carregamento progressivo funcionam no navegador. Não há serviço externo de busca nem formulário de envio de mensagens. Contato usa links de e-mail.

## Importar uma atualização do currículo

    npm run import:lattes
    npm run import:media
    npm run build
    npm run check

O importador usa ../4890516395721831.xml e extrai apenas campos acadêmicos. Ele substitui publications.json e aplica publication-overrides.json. Para outro XML, execute node scripts/import-lattes.mjs CAMINHO_DO_XML. Novos trabalhos inseridos em publication-additions.json são mantidos e têm prioridade quando o identificador coincide.

## Organização técnica

- scripts/build-site.mjs: gera a inicial escolhida e as páginas internas.
- scripts/build-prototypes.mjs: componentes do desenho original e versões preservadas.
- scripts/build.mjs: atalho para a geração completa.
- dist/styles.css: identidade editorial da proposta escolhida.
- dist/pages.css: estilos das páginas internas e ajustes responsivos.
- dist/site.js: menu, filtros da inicial e botões de cópia.
- dist/catalogue.js: busca e filtros do catálogo.
- scripts/check.mjs: valida arquivos e âncoras locais.
- qa/: capturas de verificação, excluídas do empacotamento.

## Estado da entrega

Site estático bilíngue com publicação por GitHub Pages. A configuração está em `.github/workflows/pages.yml`; cada atualização de `main` gera e verifica a versão pública antes da publicação. Consulte PUBLICACAO.md. O XML original não integra o site nem o repositório.

O histórico reúne 17 registros de cursos, incluindo nove entradas de 2022 a 2026 conferidas nos programas de Ensino e PASSADO. FONTES_ENSINO.md documenta as fontes e as três ofertas cujos programas não foram localizados. Ainda faltam crédito fotográfico, equipes e financiamento dos projetos e revisão de referências incompletas. O vínculo para o quadro atual de disciplinas aponta ao IESP.

## Português e inglês

O seletor PT/EN está no cabeçalho das oito páginas atuais. A versão inglesa começa em dist/en/index.html; as demais páginas são about.html, publications.html, research.html, teaching.html, media.html, contact.html e notes.html. As duas versões compartilham 190 publicações e 17 registros de cursos, além das imagens e estilos. A troca mantém a página correspondente, a âncora e os filtros do catálogo.

As traduções ficam em content/en.json. Consulte CONTEUDO.md para atualizar textos e acrescentar registros. A geração e a verificação são feitas com npm run build e npm run check.
