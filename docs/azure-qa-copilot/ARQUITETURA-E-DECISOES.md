# Arquitetura revisada e decisões pendentes — Fase 0

Sem código. Proposta para revisão antes da Fase 1.

## 1. Arquitetura revisada

Dois componentes independentes, com nomes que refletem o papel:

```
UI (revisão do QA)
   │
   ├── AzureTestFlowService   ← executa o fluxo definido (sem decisões autônomas)
   │      └── AzureDevOpsClient  (HTTP, PAT, api-version, paginação, erros)
   │
   └── QAScenarioAgent        ← única parte "inteligente": propõe cenários a partir da demanda
          └── ScenarioSchema (validação JSON)
```

- **AzureTestFlowService** (antes "AzureFlowAgent"): apenas executa a sequência da Parte 1 via API. Não escolhe plano nem suíte.
- **QAScenarioAgent**: lê a demanda e gera cenários (Gherkin + Action/Expected). Não conhece o Azure.
- **Regra de seleção:** o sistema **pode sugerir** Test Plan/Test Suite com base no contexto (nome, iteração, área, `requirementId`), mas **no MVP a seleção final é feita ou confirmada pelo QA**. Nada é gravado antes disso.

### Métodos do `AzureTestFlowService` (nomes provisórios)
| Método | Endpoint (ver API-MAPPING) | Situação |
|---|---|---|
| `getWorkItem(id)` | `GET /wit/workitems/{id}?$expand=all` | Pronto para implementar |
| `searchWorkItems(filters)` | `POST /wit/wiql` + `workitemsbatch` | Pronto para implementar |
| `listTestPlans()` | `GET /testplan/plans` | Pronto para implementar |
| `getSuiteTree(planId)` | `GET /testplan/Plans/{planId}/suites?asTreeView=true` | Pronto para implementar |
| `suggestSuiteForWorkItem(tree, wi)` | lógica local | Só sugere; QA confirma |
| `buildTestCasePayload(scenario)` | gera `JsonPatchDocument` com `System.Title`, `System.Description`, `Microsoft.VSTS.TCM.Steps` (XML) | Depende de L2 |
| `validateTestCase(payload)` | `POST /wit/workitems/$Test Case?validateOnly=true` | Útil no modo "somente análise" |
| `createTestCase(payload)` | `POST /wit/workitems/$Test Case` | Só com confirmação do QA |
| `addTestCaseToSuite(planId, suiteId, ids)` | `POST .../Suites/{suiteId}/TestCase` (array) | Pronto para implementar |
| `linkToRequirement(testCaseId, requirementId)` | `PATCH /wit/workitems/{id}` | Depende de L6 |
| `verifySuite(planId, suiteId)` | `GET .../Suites/{suiteId}/TestCase` | Pronto para implementar |
| `reuseTestCases(...)` | *(comportamento a definir após a Fase 0)* | **Fora da interface** até validar L3 |

> `copyTestCases()` foi renomeado para `reuseTestCases()` e **não é uma operação confirmada**. Ela permanece **abstrata**: não se escolhe ainda entre reutilizar o mesmo Test Case, clonar Test Case, clonar suíte ou outro comportamento.
>
> **Padronização:** todas as operações de plano/suíte/caso usam `/_apis/testplan/...` 7.1 (ver `API-MAPPING.md`).

### Estrutura de pastas proposta (para a Fase 1)
```
src/
  azure/        AzureDevOpsClient, AzureTestFlowService, payloads, tipos
  scenarios/    QAScenarioAgent, schema, formatadores (Gherkin, Steps XML)
  ui/           telas de revisão
  audit/        registro local (sem PAT)
tests/          testes unitários com mocks separados da implementação real
```

### Modos
- **Somente análise:** só GETs (e `validateOnly=true` no POST de Test Case, se confirmado).
- **Execução:** só após confirmação explícita do QA.

## 2. Decisões que precisam ser confirmadas no Azure real

| # | Decisão | Como confirmar |
|---|---|---|
| A1 | Tipos de Work Item usados como "demanda" (US, EF, OS…) e o campo dos critérios de aceite | `GET /wit/workitemtypes` e `.../{type}/fields` |
| A2 | Campos obrigatórios do Test Case (Area Path, Iteration, State, Assigned To) | `GET /wit/workitemtypes/Test Case/fields?$expand=all` |
| A3 | Formato exato do XML dos Steps | Ler `Microsoft.VSTS.TCM.Steps` de um Test Case existente |
| A4 | Convenção da suíte da demanda (`requirementTestSuite` ou estática por nome) e nomes das suítes de Sprint | `GET /testplan/Plans/{planId}/suites?asTreeView=true` num plano real |
| A5 | Criar Test Case + `Add` à suíte já cria o vínculo com a demanda? | Teste em plano de sandbox |
| A6 | Tipo de relação Test Case → demanda | `GET /_apis/wit/workitemrelationtypes` |
| A7 | O vídeo demonstra **copiar** ou **reaproveitar** Test Cases? O resultado do clone via API é igual ao da interface? | Comparar um "Copy" na interface com `CloneTestCaseOperation` |
| A8 | Formato HTML aceito em `System.Description` para o Gherkin | Criar um Test Case de teste e abrir na interface |
| A9 | Permissões e escopos do PAT | Teste de leitura/escrita em sandbox |
| A10 | Padrão de título (`[SAMWEB | EMERGÊNCIA] ...`) e demais convenções do vídeo | Confirmar com o QA que gravou o vídeo |
| A11 | Regras ditas só em áudio | Levantar com o QA |
| A12 | `testPlan` 7.2 muda algo relevante? | Comparar specs 7.1 × 7.2 e documentação do Learn (fora deste ambiente) |

## 3. Proposta de próxima etapa (após sua revisão)
- **Fase 1** com um Azure de sandbox ou somente leitura: `getWorkItem`, `listTestPlans`, `getSuiteTree`, e um script de **descoberta** (A1–A4) que grava, sem alterar nada, um resumo do formato real dos Test Cases e da árvore de suítes.
- Só depois `createTestCase` / `addTestCaseToSuite`.
