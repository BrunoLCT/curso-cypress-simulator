# LIMITACOES — Fase 0

Diferenças entre o que se faz **na interface** do Azure DevOps e o que a **API oficial** permite. Base: especificações OpenAPI 7.1 da Microsoft (ver `API-MAPPING.md` para a fonte e o nível de confiança).

## Limitações da própria pesquisa (importante)
- **Páginas do Microsoft Learn não foram lidas** (bloqueadas pelo proxy do ambiente). Textos explicativos, exemplos e regras de comportamento que só existem nas páginas **não** foram verificados.
- **Nada foi executado contra um Azure real.** O que depende do seu projeto (tipos de Work Item, campos, processo, permissões) está como [CONFIRMAR NO AZURE REAL].
- O `testPlan` 7.2 existe no repositório da Microsoft e **não foi comparado** com o 7.1.

## L1 — Test Case não é criado pela API de Test Plans
A API `testplan` não tem endpoint para **criar** Test Case: ele é um Work Item criado por `POST /wit/workitems/$Test Case` e depois **adicionado à suíte** por `POST .../Suites/{suiteId}/TestCase` (corpo é um **array**). Na interface isso é um passo só.
**Impacto:** o fluxo de criação tem 2 chamadas por Test Case e pode ficar incompleto se a segunda falhar (Test Case criado e fora da suíte).
**Mitigação a decidir:** validar com `validateOnly=true`, criar, adicionar à suíte, conferir com `GET .../TestCase` e reportar falhas parciais sem tentar "reparar" sozinho.

## L2 — Steps são XML em um campo, sem API estruturada
Os passos Action / Expected Result ficam no campo `Microsoft.VSTS.TCM.Steps` como **string XML**. Não existe endpoint que receba uma lista de passos.
**Impacto:** o sistema precisa gerar esse XML corretamente (escape de HTML/caracteres, numeração de passos). Erro aqui gera Test Case sem passos ou corrompido.
**Mitigação:** copiar o formato de um Test Case real do seu Azure e cobrir a geração com testes.

## L3 — "Copy test case(s)": existe a operação de clone, mas com diferenças a validar
- Existe `POST /testplan/TestCases/CloneTestCaseOperation` [VERIFICADO NA SPEC], com origem e destino de plano e suíte, `testCaseIds` e opções `includeAttachments`, `includeLinks` e `relatedLinkComment`. O destino aceita informar o **projeto**, o que cobre a seleção Project / Test Plan / Test Suite do vídeo.
- É **assíncrona**: devolve um `opId` e um estado (`queued`, `inProgress`, `succeeded`, `failed`) que precisa ser consultado.
- **Cria novos Test Cases** vinculados ao original (o comentário do link é opção do clone). Isso é diferente de apenas **adicionar o mesmo Test Case existente** a outra suíte (L1, item 12), que **reutiliza** o mesmo Work Item.
**Pontos abertos [CONFIRMAR NO AZURE REAL]:** (a) o resultado do clone pela API é idêntico ao "Copy" da interface (título, campos, passos, links, anexos)? (b) qual comportamento o vídeo demonstra: **copiar** ou **reaproveitar (adicionar existente)**? (c) as opções "reaproveitar informações/links/anexos" da interface correspondem a `includeLinks` e `includeAttachments`? A spec não tem outras opções de cópia.
- Também existe **clonagem de suíte** (`POST /testplan/Suites/CloneOperation`) e de plano (`POST /testplan/Plans/CloneOperation`), com o parâmetro `deepClone` ("clona também os Test Cases associados") [VERIFICADO NA SPEC].
**Decisão:** `reuseTestCases()` fica **abstrato**. Não escolher ainda entre (1) reutilizar o mesmo Test Case em outra suíte, (2) clonar Test Case, (3) clonar suíte ou (4) outro comportamento. Primeiro observar o comportamento real do Azure e compará-lo com o vídeo. A operação só entra na interface **depois** dessa validação.

## L4 — Localizar o Test Plan/Suite "do contexto" não tem filtro por Sprint
A listagem de planos só filtra por `owner` e planos ativos. Não filtra por Sprint, Area Path ou Iteration [VERIFICADO NA SPEC].
**Impacto:** a "estrutura relacionada à Sprint / ciclo" precisa ser encontrada **no cliente**, percorrendo a árvore de suítes (`asTreeView=true`) e comparando nomes.
**Regra:** o sistema pode **sugerir**, mas o Test Plan e a Test Suite são **selecionados ou confirmados pelo QA**.

## L5 — Convenção de suíte por demanda depende do seu projeto
A spec prevê `requirementTestSuite` (com `requirementId`), `staticTestSuite`, `dynamicTestSuite` e `none`. Não dá para saber, sem olhar o seu Azure, qual tipo a equipe usa para a suíte da demanda nem como as suítes de Sprint são nomeadas.
**Mitigação:** ler a árvore real de um plano de exemplo na Fase 1.

## L6 — Vínculo Test Case ↔ demanda
Há dois mecanismos: (a) suíte de requisito e (b) relação no Work Item (`PATCH /wit/workitems/{id}`, `add /relations/-`). Na interface, adicionar o Test Case a uma suíte de requisito cria o vínculo; **se a API faz o mesmo automaticamente não está na spec**.
**Decisão:** **nenhuma suposição** sobre o vínculo. Uma suíte baseada em requisito e um link entre Work Items não são necessariamente a mesma coisa. Descobrir **empiricamente** (Fase 1, somente leitura): quais relações existem no Work Item; se a suíte é requirement-based e qual `requirementId` ela tem; quais links aparecem no Test Case; e se a associação à suíte cria algum vínculo adicional. O tipo de relação (esperado `TestedBy-Reverse`) deve ser lido de `GET /_apis/wit/workitemrelationtypes`.

## L7 — Campos e nomes dependem do processo do projeto
**Metadados de campo ≠ obrigatoriedade.** O endpoint por tipo (`wit/workitemtypes/{type}/fields`) devolve só `name`, `referenceName`, `alwaysRequired`, `defaultValue`, `allowedValues`, `dependentFields` e `helpText` (**sem** `type`/`readOnly`, que ficam em `GET wit/fields`) [VERIFICADO NA SPEC]. A obrigatoriedade real pode depender do tipo de Work Item, do processo, do estado e de regras configuradas. Só se marca "obrigatório confirmado" o que for **comprovado** no ambiente real; a Fase 1 (leitura) nunca o faz.

Campos como `Microsoft.VSTS.Common.AcceptanceCriteria`, `System.Description`, Area/Iteration e obrigatoriedades do Test Case variam por processo (Agile/Scrum/CMMI/customizado). Leitura por `GET /wit/workitemtypes/{type}/fields` e `GET /wit/fields`.

## L8 — Comentários usam versão preview
`GET /wit/workItems/{id}/comments` está em `7.1-preview.4` na spec. Se comentários da demanda forem necessários, aceitar o risco de preview ou deixar fora do MVP.

## L9 — Paginação e limites
Listagens de planos e casos usam `continuationToken`. Limites do WIQL e do batch [CONFIRMAR NO AZURE REAL].

## L10 — Rede e permissões
O ambiente de desenvolvimento pode não alcançar o Azure da empresa; a validação real será feita na sua rede. O PAT precisa dos escopos de teste e de Work Item (leitura e escrita); a permissão para criar Test Cases numa suíte específica depende do seu projeto [CONFIRMAR NO AZURE REAL].

## L11 — Operações destrutivas
Existem `DELETE` de Test Case, de suíte e de plano. **Ficam fora do MVP** e não devem ser expostas.

## O que a API **consegue** reproduzir do fluxo
Ler a demanda e relações; listar planos; navegar a árvore de suítes; criar Test Case com título e descrição em Gherkin; gravar os passos (via XML); adicionar à suíte; conferir o resultado; clonar Test Cases entre suítes/planos/projetos (a validar).

## O que **não** dá para afirmar ainda
Que a criação via API produz o **mesmo estado final** que a interface (vínculo com a demanda, campos automáticos, formato dos passos e o resultado do clone). Isso só se confirma testando no Azure real.
