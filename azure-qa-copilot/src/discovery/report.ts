import { flattenSuites, type SuiteRow } from './suites.js';

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec => (v && typeof v === 'object' ? (v as Rec) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string => (typeof v === 'string' ? v : v === undefined || v === null ? '' : JSON.stringify(v));

export interface DiscoveryData {
  workItem: unknown;
  plan?: unknown;
  plansList?: unknown[];
  suitesTree?: unknown;
  suitesFlat?: unknown;
  testCase?: unknown;
  testCaseSuites?: unknown;
  relationTypes?: unknown;
  testCaseTypeFields?: unknown;
  notes: string[];
}

export interface ReportOptions {
  project: string;
  generatedAt: string;
  masked: boolean;
  /** Inclui trechos de texto (título, descrição, passos). */
  samples: boolean;
}

export interface RelationRow {
  rel: string;
  name: string;
  targetId: number | undefined;
}

export function relationsOf(wi: unknown): RelationRow[] {
  return arr(rec(wi).relations).map((r) => {
    const x = rec(r);
    const url = str(x.url);
    const m = /\/workItems\/(\d+)$/i.exec(url);
    return { rel: str(x.rel), name: str(rec(x.attributes).name), targetId: m ? Number(m[1]) : undefined };
  });
}

export function stepCount(xml: string): number {
  return (xml.match(/<step\b/gi) ?? []).length;
}

const cut = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n)}…` : s);
const cell = (s: string): string => s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

function table(head: string[], rows: string[][]): string {
  if (!rows.length) return '_(nenhum)_\n';
  return [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n') + '\n';
}

export function buildReport(d: DiscoveryData, o: ReportOptions): string {
  const wi = rec(d.workItem);
  const f = rec(wi.fields);
  const demandId = typeof wi.id === 'number' ? wi.id : undefined;
  const acKeys = Object.keys(f).filter((k) => /acceptance/i.test(k));
  const wiRel = relationsOf(d.workItem);

  const suites: SuiteRow[] = flattenSuites(d.suitesTree ?? d.suitesFlat);
  const byType = new Map<string, number>();
  for (const s of suites) byType.set(s.suiteType ?? '(sem tipo)', (byType.get(s.suiteType ?? '(sem tipo)') ?? 0) + 1);
  const reqSuites = suites.filter((s) => s.requirementId !== undefined);
  const demandSuites = reqSuites.filter((s) => s.requirementId === demandId);

  const tc = rec(d.testCase);
  const tf = rec(tc.fields);
  const tcRel = relationsOf(d.testCase);
  const steps = str(tf['Microsoft.VSTS.TCM.Steps']);
  const desc = str(tf['System.Description']);
  const tcLinksDemand = tcRel.filter((r) => r.targetId !== undefined && r.targetId === demandId);
  const tcSuites = arr(rec(d.testCaseSuites).value ?? d.testCaseSuites).map(rec);
  const relTypes = arr(rec(d.relationTypes).value ?? d.relationTypes).map(rec);
  const testedBy = relTypes.filter((r) => /testedby/i.test(str(r.referenceName))).map((r) => str(r.referenceName));
  const requiredFields = arr(rec(d.testCaseTypeFields).value ?? d.testCaseTypeFields)
    .map(rec)
    .filter((x) => x.alwaysRequired === true)
    .map((x) => `${str(x.name)} (\`${str(x.referenceName)}\`)`);

  const L: string[] = [];
  L.push('# DESCOBERTA-AMBIENTE — raio-X do Azure DevOps (somente leitura)');
  L.push('');
  L.push(`Gerado em ${o.generatedAt} · projeto **${o.project}** · API 7.1 · identidades ${o.masked ? 'mascaradas' : '**NÃO mascaradas**'}.`);
  L.push('');
  L.push('> Nenhuma operação de escrita foi executada: o cliente só implementa `GET`. Este relatório pode conter dados do seu ambiente: revise antes de compartilhar ou commitar.');
  L.push('');
  if (d.notes.length) {
    L.push('## Avisos da execução', '', ...d.notes.map((n) => `- ${n}`), '');
  }

  L.push('## 1. A demanda (Work Item)', '');
  L.push(
    table(
      ['Campo', 'Valor'],
      [
        ['ID', str(wi.id)],
        ['Work Item Type', str(f['System.WorkItemType'])],
        ['State', str(f['System.State'])],
        ['Area Path', str(f['System.AreaPath'])],
        ['Iteration Path', str(f['System.IterationPath'])],
        ['Tags', str(f['System.Tags'])],
        ['Título', o.samples ? cut(str(f['System.Title']), 120) : '(omitido)'],
        ['Campos de critérios de aceite', acKeys.length ? acKeys.map((k) => `\`${k}\``).join(', ') : '**nenhum campo com "Acceptance" encontrado**'],
        ['Qtd. de campos', String(Object.keys(f).length)],
      ],
    ),
  );
  L.push('**Relações da demanda:**', '', table(['rel', 'nome', 'ID alvo'], wiRel.map((r) => [r.rel, r.name, String(r.targetId ?? '')])));

  L.push('## 2. Test Plan', '');
  const plan = rec(d.plan);
  L.push(
    d.plan
      ? table(
          ['Campo', 'Valor'],
          [
            ['ID', str(plan.id)],
            ['Nome', str(plan.name)],
            ['State', str(plan.state)],
            ['Area Path', str(plan.areaPath)],
            ['Iteration', str(plan.iteration)],
            ['Root suite', `${str(rec(plan.rootSuite).id)} ${str(rec(plan.rootSuite).name)}`],
          ],
        )
      : '_Plano não informado nesta execução._\n',
  );
  if (d.plansList?.length) {
    L.push('Planos existentes (use `--plan`):', '', table(['ID', 'Nome', 'Iteration'], d.plansList.map((p) => [str(rec(p).id), str(rec(p).name), str(rec(p).iteration)])));
  }

  L.push('## 3. Árvore de Test Suites', '');
  if (suites.length) {
    L.push(`Total de suítes: **${suites.length}**. Por tipo: ${[...byType].map(([t, n]) => `\`${t}\`=${n}`).join(', ')}.`, '');
    L.push(`Suítes com \`requirementId\`: **${reqSuites.length}**. Apontando para a demanda ${demandId ?? ''}: **${demandSuites.length}**.`, '');
    L.push(
      table(
        ['ID', 'Tipo', 'requirementId', 'Query', 'Caminho'],
        suites.slice(0, 200).map((s) => [String(s.id), s.suiteType ?? '', String(s.requirementId ?? ''), s.queryString ? 'sim' : '', s.path]),
      ),
    );
    if (suites.length > 200) L.push(`_(mostrando 200 de ${suites.length}; veja \`discovery/test-suites.json\`)_`, '');
  } else L.push('_Árvore não coletada._', '');

  L.push('## 4. Test Case real', '');
  if (d.testCase) {
    L.push(
      table(
        ['Campo', 'Valor'],
        [
          ['ID', str(tc.id)],
          ['Work Item Type', str(tf['System.WorkItemType'])],
          ['State', str(tf['System.State'])],
          ['Area Path', str(tf['System.AreaPath'])],
          ['Iteration Path', str(tf['System.IterationPath'])],
          ['Priority', str(tf['Microsoft.VSTS.Common.Priority'])],
          ['Tags', str(tf['System.Tags'])],
          ['Título', o.samples ? cut(str(tf['System.Title']), 120) : '(omitido)'],
          ['Description está em HTML?', desc ? (/<[a-z][\s\S]*?>/i.test(desc) ? 'sim' : 'não (texto puro)') : '(vazia)'],
          ['Steps: campo presente / nº de `<step>`', `${steps ? 'sim' : 'não'} / ${stepCount(steps)}`],
        ],
      ),
    );
    L.push('**Relações do Test Case:**', '', table(['rel', 'nome', 'ID alvo'], tcRel.map((r) => [r.rel, r.name, String(r.targetId ?? '')])));
    L.push('**Suítes que contêm este Test Case:**', '', table(['ID', 'Nome', 'Tipo', 'requirementId'], tcSuites.map((s) => [str(s.id), str(s.name), str(s.suiteType), str(s.requirementId)])));
    if (o.samples) {
      L.push('**Amostra da Description (bruta, 400 caracteres):**', '', '```html', cut(desc, 400), '```', '');
      L.push('**Amostra do campo Steps (XML bruto, 1500 caracteres):**', '', '```xml', cut(steps, 1500), '```', '');
    }
  } else L.push('_Test Case não informado/encontrado nesta execução._', '');

  L.push('## 5. Campos obrigatórios do tipo Test Case', '');
  L.push(requiredFields.length ? requiredFields.map((x) => `- ${x}`).join('\n') + '\n' : '_Não coletado (ver avisos) ou nenhum marcado como `alwaysRequired`._\n');

  L.push('## 6. Hipóteses da Fase 0 × o que foi observado', '');
  const yes = (b: boolean, ok: string, no: string): string => (b ? ok : no);
  L.push(
    table(
      ['#', 'Hipótese / pergunta', 'Observado', 'Situação'],
      [
        ['A1', 'Tipo da demanda e campo dos critérios de aceite', `Tipo \`${str(f['System.WorkItemType'])}\`; campos: ${acKeys.join(', ') || 'nenhum'}`, yes(acKeys.length > 0, 'Confirmado', 'Divergente: procurar o campo em `work-item.json`')],
        ['A2', 'Campos obrigatórios do Test Case', requiredFields.join('; ') || 'não coletado', yes(requiredFields.length > 0, 'Coletado', 'Revisar manualmente')],
        ['A3', 'Steps em XML no campo `Microsoft.VSTS.TCM.Steps`', `presente=${steps ? 'sim' : 'não'}, passos=${stepCount(steps)}`, yes(!!steps, 'Confirmado (ver amostra)', d.testCase ? 'Não observado' : 'Sem Test Case')],
        ['A4', 'Convenção da suíte da demanda', `tipos: ${[...byType].map(([t, n]) => `${t}=${n}`).join(', ') || 'n/d'}; suítes para a demanda: ${demandSuites.length}`, yes(demandSuites.length > 0, 'Existe suíte requirement-based apontando para a demanda', 'Nenhuma suíte aponta para a demanda: a convenção pode ser outra (por nome/estática)')],
        ['A5', 'Test Case criado/adicionado à suíte já tem vínculo com a demanda?', `Relações do Test Case para a demanda: ${tcLinksDemand.length}; suítes do Test Case: ${tcSuites.length}`, d.testCase ? yes(tcLinksDemand.length > 0, 'Há link direto Test Case → demanda', 'Sem link direto: o vínculo pode existir só via suíte de requisito') : 'Sem Test Case'],
        ['A6', 'Tipo de relação Test Case ↔ demanda', `TestedBy: ${testedBy.join(', ') || 'não coletado'}; rel do Test Case: ${[...new Set(tcRel.map((r) => r.rel))].join(', ') || 'nenhuma'}`, 'Comparar manualmente'],
        ['A8', 'Formato da Description (Gherkin)', desc ? (/<[a-z][\s\S]*?>/i.test(desc) ? 'HTML' : 'texto puro') : 'vazia', d.testCase ? 'Ver amostra' : 'Sem Test Case'],
        ['A10', 'Padrão de título / Area / Iteration', o.samples ? `Título: ${cut(str(tf['System.Title']), 80)}; Area: ${str(tf['System.AreaPath'])}; Iteration: ${str(tf['System.IterationPath'])}` : 'omitido', 'Comparar com o vídeo'],
      ],
    ),
  );

  L.push('## 7. Perguntas que a Fase 1 devia responder', '');
  L.push(
    [
      `- **Como a US é identificada?** Tipo \`${str(f['System.WorkItemType'])}\`, ID \`${str(wi.id)}\`.`,
      `- **Como a Sprint aparece?** Iteration Path da demanda: \`${str(f['System.IterationPath'])}\`; do plano: \`${str(plan.iteration)}\`.`,
      `- **Como a suíte da demanda é criada / qual o tipo?** ${demandSuites.length ? demandSuites.map((s) => `\`${s.suiteType}\` "${s.path}"`).join('; ') : 'nenhuma suíte requirement-based aponta para a demanda (verificar suíte informada e nomes na árvore).'}`,
      `- **Como um Test Case está ligado à US?** Links diretos: ${tcLinksDemand.length}; suítes do Test Case: ${tcSuites.length}.`,
      `- **Como o Gherkin fica salvo?** ${desc ? (/<[a-z][\s\S]*?>/i.test(desc) ? 'HTML na Description' : 'texto puro na Description') : 'Description vazia neste Test Case'}.`,
      `- **Como Action/Expected ficam no XML?** ${steps ? `campo Steps com ${stepCount(steps)} passo(s); ver amostra` : 'campo Steps ausente'}.`,
      `- **Campos obrigatórios?** ${requiredFields.length ? requiredFields.join('; ') : 'não coletados'}.`,
    ].join('\n'),
  );
  L.push('', '---', 'Próximo passo: revisar estes dados com o QA. **Não** iniciar geração de cenários nem escrita no Azure antes dessa revisão.', '');
  return L.join('\n');
}
