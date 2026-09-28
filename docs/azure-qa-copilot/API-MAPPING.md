# API-MAPPING — Fluxo (Parte 1 do PROMPT-MESTRE) × Azure DevOps REST API

**Fase 0.** Nenhum código foi escrito. Este documento só mapeia o fluxo para endpoints.

## Fonte e nível de confiança

- **Fonte usada:** as especificações OpenAPI (Swagger 2.0) **oficiais da Microsoft**, do repositório `MicrosoftDocs/vsts-rest-api-specs`, versão **7.1**: `specification/testPlan/7.1/testPlan.json` e `specification/wit/7.1/workItemTracking.json`. Essas especificações são a origem das páginas de referência do Microsoft Learn.
- **Não consegui abrir** as páginas do Microsoft Learn (`learn.microsoft.com`): o proxy do ambiente bloqueou. A busca web funcionou só para confirmar existência de endpoints. Portanto **descrições textuais e exemplos das páginas não foram lidos**.
- Existe também `testPlan/7.2` no repositório; **não foi comparado** com o 7.1. Os endpoints abaixo foram lidos no 7.1.
- Marcações: **[VERIFICADO NA SPEC]** = lido na especificação · **[CONFIRMAR NO AZURE REAL]** = não consta na spec (conhecimento geral ou dependente do seu processo/projeto) e não deve virar código sem teste.
- Base: `https://dev.azure.com/{organization}/{project}/_apis/...`. Versão: `api-version=7.1` em todos os endpoints abaixo, **exceto Comments** (`7.1-preview.4`, preview) [VERIFICADO NA SPEC].
- Autenticação (spec do Test Plan): escopos OAuth `vso.test` (leitura) e `vso.test_write` (escrita). Escopos de Work Item Tracking [CONFIRMAR NO AZURE REAL] (esperado `vso.work` / `vso.work_write`).

## Legenda de suporte
**Total** = existe endpoint direto · **Parcial** = existe, mas com lacuna/observação · **Não** = sem endpoint direto.

---

## Tabela do fluxo

| # | Etapa do fluxo (Parte 1) | Objeto | Endpoint | Método | Entrada | Retorno | Suporte |
|---|---|---|---|---|---|---|---|
| 1 | Acessar o Azure DevOps | Organization / Project | (autenticação por PAT, cabeçalho `Authorization: Basic`) | – | PAT com escopos | – | Total ¹ |
| 2a | Localizar a demanda por ID | Work Item | `/wit/workitems/{id}` | GET | `id`, `$expand`, `fields` | WorkItem | Total |
| 2b | Localizar demandas por filtro | Work Item | `/{team}/_apis/wit/wiql` (+ `/wit/workitemsbatch`) | POST | body `Wiql {query}`, `$top` | IDs (`workItems`) | Total ² |
| 3 | Ler título, descrição, critérios, vínculos | Work Item | `/wit/workitems/{id}?$expand=all` | GET | `$expand` ∈ `none, relations, fields, links, all` | campos + `relations` | Total ³ |
| 3b | Comentários da demanda | Work Item | `/wit/workItems/{id}/comments` | GET | – | comentários | Total (**preview**) |
| 4 | Acessar Test Plans | Test Plan | `/testplan/plans` | GET | `owner`, `includePlanDetails`, `filterActivePlans`, `continuationToken` | lista de TestPlan (com `rootSuite`) | Total |
| 5 | Localizar o Test Plan do contexto | Test Plan | `/testplan/plans/{planId}` | GET | `planId` | TestPlan | Parcial ⁴ |
| 6 | Navegar pela estrutura de suítes | Test Suite | `/testplan/Plans/{planId}/suites` | GET | `asTreeView`, `expand` ∈ `none, children, defaultTesters` | TestSuite (árvore, `children`) | Total |
| 7a | Localizar a suíte da demanda | Test Suite | `/testplan/Plans/{planId}/suites` (percorrer árvore) | GET | – | `suiteType`, `requirementId`, `name` | Parcial ⁵ |
| 7b | Localizar suítes que contêm um Test Case | Test Suite | `/{organization}/_apis/testplan/suites?testCaseId=` | GET | `testCaseId` | suítes | Total |
| 7c | Criar suíte da demanda (só se o fluxo exigir) | Test Suite | `/testplan/Plans/{planId}/suites` | POST | `TestSuiteCreateParams`: `suiteType`, `name`, `parentSuite{id}`, `requirementId`, `queryString`… | TestSuite | Total ⁶ |
| 7d | **Copy test case(s)** | Test Case | `/testplan/TestCases/CloneTestCaseOperation` | POST | `CloneTestCaseParams` (ver LIMITACOES) | operação assíncrona (`opId`, `state`) | **Parcial** ⁷ |
| 7e | Acompanhar a cópia | Test Case | `/testplan/TestCases/CloneTestCaseOperation/{cloneOperationId}` | GET | `cloneOperationId` | `state` ∈ `failed, inProgress, queued, succeeded` | Total |
| 8 | Criar Test Case (título, descrição, passos) | Work Item (Test Case) | `/wit/workitems/${type}` com `$type = Test Case` | POST | `Content-Type: application/json-patch+json`; `JsonPatchDocument`; `validateOnly`, `bypassRules`, `suppressNotifications` | WorkItem | Total ⁸ |
| 9 | Descrição em Gherkin | Campo do Test Case | mesmo POST/PATCH: campo `System.Description` | POST/PATCH | HTML | – | Total ⁹ |
| 10 | Steps Action / Expected Result | Campo do Test Case | mesmo POST/PATCH: campo `Microsoft.VSTS.TCM.Steps` | POST/PATCH | **XML em string** | – | **Parcial** ¹⁰ |
| 11 | Consultar Work Items com filtros (Iteration, Area, Type, Changed Date) | Work Item / nós | WIQL (item 2b); `/wit/classificationnodes/{structureGroup}/{path}` | POST / GET | `$depth` | nós de área/iteração | Total ² |
| 12 | Incluir Test Case na suíte | Test Case × Suite | `/testplan/Plans/{planId}/Suites/{suiteId}/TestCase` | POST | **array** de `{workItem:{id}, pointAssignments:[{configurationId}]}` | TestCase | Total |
| 13 | Vincular à demanda | Relação | (a) suíte `requirementTestSuite` com `requirementId`; (b) `PATCH /wit/workitems/{id}` com op `add /relations/-` | PATCH | `rel`, `url` | WorkItem | **Parcial** ¹¹ |
| 14 | Conferir o resultado final | Test Case × Suite | `/testplan/Plans/{planId}/Suites/{suiteId}/TestCase` | GET | `witFields`, `expand`, `isRecursive` | lista de TestCase | Total |

### Notas

1. Autenticação com PAT (Basic) é padrão do Azure DevOps [CONFIRMAR NO AZURE REAL]; a spec só lista OAuth2 `vso.test`/`vso.test_write` e `accessToken`.
2. `/{team}/` é parte do caminho do WIQL na spec. A consulta devolve **IDs**; os campos vêm de `workitemsbatch` ou `GET workitems?ids=`. Limites de quantidade [CONFIRMAR NO AZURE REAL]. Nomes de campo usados em filtros (`System.IterationPath`, `System.AreaPath`, `System.WorkItemType`, `System.ChangedDate`) são **conhecimento geral** [CONFIRMAR: `GET /wit/fields`].
3. Campo de critérios de aceite: `Microsoft.VSTS.Common.AcceptanceCriteria` é o esperado em User Story; depende do tipo/processo (Agile/Scrum/CMMI) [CONFIRMAR NO AZURE REAL: `GET /wit/workitemtypes/{type}/fields`].
4. A API de listagem só filtra por `owner` e planos ativos. **Não há filtro por Sprint, Area ou Iteration** no endpoint [VERIFICADO NA SPEC]; a seleção do plano do contexto será feita no cliente (nome, `areaPath`, `iteration`) **e confirmada pelo QA**.
5. O tipo de suíte (`requirementTestSuite`, `staticTestSuite`, `dynamicTestSuite`, `none`) e o `requirementId` existem na spec. **Como a sua equipe monta a suíte "da demanda"** (por requisito ou estática com nome) [CONFIRMAR NO AZURE REAL].
6. Criar suítes só entra se o processo do vídeo exigir; a regra da Parte 1 diz para respeitar a estrutura existente. **Sugestão: não criar suítes no MVP.**
7. É a operação equivalente ao "Copy test case(s)". **Cria novos Test Cases** (o parâmetro `relatedLinkComment` fala em "link do novo Test Case clonado com o original") [VERIFICADO NA SPEC]. Opções da spec: `includeAttachments`, `includeLinks`, `relatedLinkComment`. Ver `LIMITACOES.md`.
8. **Não existe endpoint no `testplan` para criar um Test Case**: o Test Case é um Work Item criado pela API de Work Item Tracking, e depois é **adicionado** à suíte pelo item 12 [VERIFICADO NA SPEC: a API `testplan` só tem Add/Get/Update/Remove de Test Cases em suíte, Clone e Delete]. O parâmetro `validateOnly` permite **simular a criação sem gravar**, útil para o modo "somente análise".
9. Campo e formato HTML para exibir quebras de linha: [CONFIRMAR NO AZURE REAL] (na importação por CSV já usamos `<br>`).
10. Não há API estruturada para passos: o campo é um **XML** dentro de uma string. O formato exato do XML deve ser copiado de um Test Case real (`GET /wit/workitems/{id}?$expand=all`) [CONFIRMAR NO AZURE REAL].
11. O tipo de relação Test Case → requisito (esperado `Microsoft.VSTS.Common.TestedBy-Reverse`) [CONFIRMAR: `GET /_apis/wit/workitemrelationtypes`]. Se adicionar o Test Case a uma suíte de requisito cria o link automaticamente, como na interface, **não está na spec**.

---

## Endpoints extras encontrados (fora do MVP)

| Operação | Endpoint | Observação |
|---|---|---|
| Clonar suíte | `POST /testplan/Suites/CloneOperation` (`deepClone`) | Não faz parte do fluxo do vídeo |
| Clonar plano | `POST /testplan/Plans/CloneOperation` (`deepClone`) | Idem |
| Remover Test Case da suíte | `DELETE /testplan/Plans/{planId}/Suites/{suiteId}/TestCase?testIds=` | Só remove da suíte |
| Excluir Test Case | `DELETE /testplan/testcases/{testCaseId}` | Destrutivo: **fora do MVP** |
| Reordenar entradas | `PATCH /testplan/suiteentry/{suiteId}` | Não usado no vídeo |
| Test points, configurações, variáveis | `/testplan/...TestPoint`, `configurations`, `variables` | Execução de testes; fora do escopo |

## Resumo

| Etapa do fluxo | Situação |
|---|---|
| Ler demanda, relações, filtros | Suportado |
| Navegar Test Plans e suítes | Suportado (seleção do plano por contexto é no cliente) |
| Criar Test Case (título, descrição em Gherkin) | Suportado (via Work Item) |
| Steps Action/Expected | **Parcial**: XML dentro de campo, formato a copiar de um Test Case real |
| Adicionar à suíte | Suportado |
| Vincular à demanda | **Parcial**: dois mecanismos, comportamento automático não confirmado |
| "Copy test case(s)" | **Parcial**: existe a operação de clone, mas é assíncrona e o resultado precisa ser comparado com o da interface |
