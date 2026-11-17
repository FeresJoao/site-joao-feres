# Como atualizar o conteúdo

Edite os JSON em content e execute npm run build. Não é necessário editar HTML para acrescentar registros. Depois execute npm run check.

## Nova publicação

Acrescente um objeto a content/publication-additions.json. Use um identificador único. Tipos: article, book ou chapter. Exemplo de estrutura (substitua todos os valores de exemplo):

```json
{
  "id": "artigo-identificador-unico",
  "type": "article",
  "title": "Título do trabalho",
  "year": 2026,
  "authors": ["João Feres Júnior"],
  "venue": "Nome do periódico",
  "volume": "1",
  "pages": "1–20",
  "language": "Português",
  "doi": null,
  "url": null,
  "published": true
}
```

Campos adicionais: subtitle, containerTitle (livro que contém o capítulo), publisher, edition, isbn, location e pageCount. Omita campos não conhecidos ou use null. Não invente links: url recebe o link confirmado do DOI, da editora ou do texto.

Para destacar o trabalho na inicial, acrescente a referência também a publications em content/editorial.json. Para trocar o livro principal, atualize book e a capa correspondente.

## Curso

Acrescente um registro a content/courses.json com id, title, institution, level, period, year, url e source. Campos opcionais: semester, description e collaboration. sourcePath registra o caminho do programa relativo à pasta Ensino apenas para manutenção; ele não é exibido no site. Mantenha as entradas em ordem cronológica decrescente. Use o semestre real quando conhecido; períodos históricos sem semestre devem explicitar essa lacuna.

As descrições e parcerias docentes aparecem automaticamente na página Ensino. url é reservado à página institucional da disciplina. Os três destaques da inicial são configurados em courses de content/editorial.json, com links ensino.html#id. Os programas originais permanecem no acervo de Ensino. Ver FONTES_ENSINO.md para a conferência de novembro de 2026.

## Grupo ou projeto

content/projects.json contém featured (projeto principal, atualmente o INCT ID-ICED), groups e selected. O destaque inclui id, name, fullName, role, institution, description, homeSummary, axes, url e source. Ele aparece antes dos demais projetos na página Pesquisa e Projetos e também na seção de pesquisa da inicial. Grupos incluem id, name, fullName, role, line, description, url e themes. Projetos incluem id, name, subtitle, period, description e source. Mantenha o papel de coordenação separado de participação.

## Biografia e imagens

content/profile.json contém a biografia longa, o perfil em inglês e shortBio, que gera a minibiografia em português para Contato e download. content/editorial.json contém o resumo e o caminho da foto. As fotos originais ficam na pasta fotos; dist/assets contém a cópia usada no site. O crédito deve ser acrescentado quando confirmado.

## Correções do Lattes

Para corrigir de forma duradoura um registro importado, use seu id em content/publication-overrides.json e informe somente os campos que mudam. O registro incompleto “Review of” está com published false. A importação não sobrescreve publication-additions.json. Guarde as novas inclusões manuais nesse arquivo.

## Tom dos títulos

As biografias e apresentações do pesquisador devem ser redigidas na terceira pessoa, tanto em português quanto em inglês.

Usar títulos descritivos e linguagem acadêmica sóbria. Preferir nomes de seções, áreas e atividades, como “Linhas de pesquisa”, “Disciplinas ministradas” e “Contato”. Evitar convites coloquiais, metáforas e frases promocionais nos títulos.

## Versão em inglês

As páginas principais usam a mesma estrutura e os mesmos registros em português e inglês. npm run build gera as páginas em português e, em seguida, o espelho em dist/en. Não edite os HTML gerados.

- content/en.json contém strings (textos de interface e traduções de parágrafos), courseTitles (títulos de apoio por id do curso), publicationTitles (traduções de apoio por id da publicação), shortBio e searchAliases (equivalentes de busca).
- Ao alterar uma descrição em português, atualize a chave correspondente em strings e sua tradução. Ao acrescentar um curso, traduza sua descrição e parceria docente em strings e acrescente o título de apoio em courseTitles usando o mesmo id.
- Novas publicações entram nas duas línguas a partir da mesma base. Seus títulos, autores e referências são preservados. Traduções opcionais de títulos entram em publicationTitles; não significam que exista uma edição em inglês.
- Os arquivos em scripts/build-languages.mjs aplicam as traduções e os caminhos correspondentes. Fotos, capa, estilos e scripts são compartilhados, sem duplicação de arquivos.
- O seletor mantém página, âncora e filtros de busca. O idioma acompanha a navegação; não há redirecionamento automático baseado no navegador.
- As duas propostas antigas e o comparador continuam em português, como arquivo do processo de escolha. O site atual tem sete pares de páginas, incluindo Dados e créditos.

Após a edição, execute npm run build e npm run check. Confira também as novas traduções nas páginas em inglês; textos sem uma entrada no dicionário permanecem no original.

Temas de pesquisa sem grupo institucional próprio ficam em researchThemes, separados de groups, em content/projects.json. São apresentados apenas como rótulos no índice de temas, sem seção descritiva própria e sem integrar a lista de grupos e observatórios.
