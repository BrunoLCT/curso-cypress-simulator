# PROMPT-MESTRE — Azure QA Copilot

Documento-fonte do projeto, para uso como especificação no Claude Code. Trabalhar **fase por fase**, nunca tudo de uma vez.

> **Status de validação:** a Parte 1 descreve o fluxo do vídeo de referência conforme relato do QA. Quem escreveu este documento não assistiu ao vídeo. Todo item marcado com **[CONFIRMAR]** deve ser validado no Azure DevOps real antes de virar código.

---

## REGRA MAIS IMPORTANTE DO PROJETO

Existe um processo operacional de criação e organização de Test Cases no Azure DevOps já definido pela equipe. Esse processo foi demonstrado em um vídeo de referência.

A aplicação **NÃO** deve criar um fluxo alternativo. Seu objetivo é reproduzir e automatizar esse processo da forma mais fiel possível. Sempre que houver conflito entre uma solução tecnicamente mais simples e o processo demonstrado, o processo demonstrado prevalece.

Não redesenhe, simplifique ou substitua o fluxo por outro processo apenas por considerá-lo tecnicamente melhor.

**Divisão de papéis:**
- O **vídeo** define o **"o quê"** e o **"em que ordem"** (regra de negócio do processo).
- A **API REST do Azure DevOps** define o **"como"** (implementação técnica).

**Não é escopo** criar automação de interface: nada de robô que clique nas telas, nem browser automation no MVP. O objetivo é chegar ao **mesmo estado final** no Azure, com a **mesma lógica operacional**, usando a API.

---

## PARTE 1 — Fluxo exato demonstrado no vídeo

1. Acessar o Azure DevOps.
2. Localizar a demanda que será testada. Ela pode ser um Work Item do tipo User Story, requisito, EF, OS ou outro tipo usado pelo projeto. **[CONFIRMAR os tipos usados]**
3. Abrir a demanda e consultar: título, descrição, critérios de aceite, dados funcionais relacionados, vínculos existentes e contexto.
4. Acessar a área de **Test Plans**.
5. Localizar o **Test Plan** correspondente ao contexto da execução.
6. Navegar pela estrutura de **Test Suites** existente, no formato:
   ```
   Test Plan
   └── estrutura relacionada à Sprint / ciclo
       └── estrutura relacionada à demanda
           └── Test Cases
   ```
   A aplicação respeita a estrutura existente e **não cria convenção organizacional própria**.
7. Localizar a Test Suite correspondente à demanda. Quando necessário, **copiar/reaproveitar Test Cases** existentes para a suíte de destino (recurso "Copy test case(s)": escolher Project, Test Plan e Test Suite de destino, com opções de reaproveitar informações/links/anexos). **[CONFIRMAR as opções exatas]**
8. Trabalhar os Test Cases da demanda. Cada Test Case tem título, descrição, informações relacionadas e passos no formato **Action | Expected Result**.
9. Os cenários podem ter representação funcional em **Gherkin/BDD** (Dado / E / Quando / Então) na **descrição**. Ela **não substitui** os Steps: o mesmo Test Case tem (A) descrição em Gherkin e (B) passos Action/Expected Result.
10. Durante a criação/organização, o usuário consulta Work Items e elementos existentes, usando filtros como Iteration Path, Area Path, Work Item Type, Changed Date e outros campos.
11. Ao final, os Test Cases estão na Test Suite adequada e vinculados ao contexto da demanda.

**Pendências para fechar esta parte [CONFIRMAR]:** regras ditas apenas em áudio; padrão de nomes de suíte e de título (ex.: `[SAMWEB | EMERGÊNCIA]`); como o vínculo Test Case ↔ demanda é feito hoje (link Tests/Tested By, requisito da suíte); campos obrigatórios do Test Case (Area Path, Iteration, State, Assigned To).

## PARTE 2 — Objetos do Azure envolvidos

Organization · Project · Work Item (US/EF/OS/requisito) e seus links · Test Plan · Test Suite (estática, por requisito, por query) · Test Case (título, descrição, Steps, campos) · Iteration Path · Area Path.

## PARTE 3 — O que hoje é feito manualmente

Toda a Parte 1: localizar demanda, ler requisito, navegar no Test Plan e nas suítes, copiar/reaproveitar Test Cases, elaborar cenários, preencher Action/Expected Result e Gherkin, vincular à demanda.

## PARTE 4 — O que queremos automatizar (MVP)

1. Reproduzir tecnicamente o fluxo operacional da Parte 1.
2. Obter uma demanda real do Azure DevOps.
3. Gerar cenários de teste com IA.
4. Apresentar os cenários para revisão humana.
5. Converter os cenários para o formato de Test Case usado hoje.
6. Criar os Test Cases na estrutura correta do Azure **após confirmação**.

**Fora do MVP:** dashboard sofisticado, matriz de rastreabilidade, percentual de cobertura, análise avançada de qualidade, scoring, agente autônomo, automação visual/browser do Azure. Podem virar features futuras.

## PARTE 5 — Onde entra a IA

Somente no momento em que o QA precisa **elaborar os cenários**:

```
Demanda no Azure → obter informações → IA analisa o requisito → IA propõe cenários
→ QA revisa → QA altera se necessário → QA aprova
→ sistema converte para o formato do Azure → Test Cases criados/organizados pelo fluxo da Parte 1
```

A IA **não** decide onde gravar, **não** altera a estrutura do Azure e **não** cria nada sem aprovação.

Regras da IA: agir como QA sênior; **não inventar regra de negócio**; onde faltar informação, marcar "Dúvida para refinamento" ou "Regra não especificada"; responder em JSON validado por schema; PT-BR.

## PARTE 6 — Formato do cenário / Test Case

Cada cenário: título, prioridade, categoria, pré-condições, dados, **Gherkin PT-BR** (vai na descrição), **passos Action | Expected Result** (vão nos Steps) e dúvidas de refinamento.

```json
{
  "title": "",
  "priority": "",
  "category": "",
  "preconditions": [],
  "gherkin": "Cenário: ...\n  Dado ...\n  Quando ...\n  Então ...",
  "azureSteps": [{ "action": "", "expectedResult": "" }],
  "requirementQuestions": []
}
```

Referência de estrutura final: os arquivos `docs/azure-import/test-cases-1276695.csv/.xlsx` (Title, Steps, Description com Gherkin). Servem só para entender a estrutura dos dados, **sem alterar o fluxo do vídeo**.

## PARTE 7 — Revisão humana (obrigatória)

```
IA sugere → QA revisa → QA edita → QA seleciona → QA confirma → sistema grava
```

Dois modos:
- **Somente análise:** lê o Azure e gera sugestões; não altera nada.
- **Execução:** só após confirmação explícita cria os Test Cases. **Nunca** criar ou alterar Work Items automaticamente.

## PARTE 8 — Gravação no Azure

Criar Test Cases na Test Suite correta, vinculados à demanda, seguindo a estrutura existente. Registrar localmente uma auditoria simples (demanda, data, cenários sugeridos/aprovados/rejeitados, IDs criados). Nunca registrar PAT.

## PARTE 9 — Limitações e regras

- Usar **prioritariamente a Azure DevOps REST API**. **Não inventar endpoints.** Não usar browser automation para mascarar limitações no MVP.
- **Antes de implementar qualquer integração:**
  1. Pesquisar a documentação oficial **atual** da API.
  2. Mapear cada ação do fluxo (Parte 1) para um endpoint real.
  3. Identificar ações **sem suporte direto**.
  4. Documentar diferenças entre a operação na interface e a possível pela API.
  5. Só depois implementar.
- Pontos a investigar (candidatos, **[CONFIRMAR na documentação]**): Work Item Tracking (ler item, links, WIQL); Test Plans / Test Suites / Test Cases; formato dos Steps do Test Case; equivalência da operação **"Copy test case(s)"** por API (se não houver, documentar como reproduzir o resultado final por APIs oficiais).
- Se o Azure real divergir (permissões, tipos de Work Item, estrutura do Test Plan), a validação acontece no ambiente do QA: o ambiente de desenvolvimento pode não alcançar o Azure. Mocks devem ficar claramente separados da implementação real.
- Autenticação inicial por **PAT** via `.env` ou secrets, nunca no código; estrutura preparada para OAuth/Microsoft Entra ID no futuro.

## PARTE 10 — Arquitetura técnica

Dois componentes independentes:

1. **AzureFlowAgent** — reproduz o fluxo do vídeo via API: `Project → Work Item → Test Plan → Test Suite → Test Case`. Camada isolada `AzureDevOpsService`: `getWorkItem()`, `getRelatedWorkItems()`, `getTestPlans()`, `getTestSuites()`, `getTestCases()`, `createTestCase()`, `addTestCaseToSuite()`, `linkTestCaseToRequirement()`, `copyTestCases()` (sujeita à investigação da Parte 9).
2. **QAScenarioAgent** — lê a demanda e propõe os cenários (Parte 5 e 6). Independente da interface e do Azure.

Stack sugerida: TypeScript strict, Node.js; interface web local simples (React ou Next.js, avaliar). Validação de schema, tratamento de erros, logs, testes unitários com mocks do Azure, sem overengineering.

### Fases

| Fase | Entrega |
|---|---|
| 0 | Pesquisa da API e mapeamento fluxo→endpoints, com limitações documentadas |
| 1 | Conectar ao Azure e exibir uma demanda real (título, descrição, critérios, links) |
| 2 | Navegar Test Plans e Test Suites existentes; escolher plano e suíte de destino |
| 3 | QAScenarioAgent: gerar cenários (Gherkin + Action/Expected) para revisão |
| 4 | Revisão e edição pelo QA; seleção dos cenários |
| 5 | Criar os Test Cases na suíte após confirmação e vincular à demanda |
| 6 | Reaproveitamento/cópia de Test Cases existentes (conforme a Fase 0) |

**Comece pela Fase 0.** Antes de qualquer código: análise deste documento, pesquisa da API, limitações, arquitetura, estrutura de diretórios, modelos de dados e MVP. Depois desenvolvemos fase por fase.
