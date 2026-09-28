import type { AzureReadOnlyClient } from '../azure/client.js';
import { assertNoSecret, sanitize, type SanitizeOptions } from './sanitize.js';
import { buildFieldUsage, buildReport, type DiscoveryData } from './report.js';
import { flattenSuites } from './suites.js';

export interface DiscoveryInput {
  workItemId: number;
  planId?: number;
  suiteId?: number;
  testCaseId?: number;
  outDir: string;
  reportPath: string;
  mask: boolean;
  samples: boolean;
  organization: string;
  project: string;
  pat: string;
}

export interface DiscoveryIO {
  write(path: string, content: string): Promise<void>;
  log(message: string): void;
  now(): Date;
}

export interface DiscoveryResult {
  exitCode: 0 | 2;
  files: string[];
  data: DiscoveryData;
}

const listOf = (v: unknown): unknown[] => (Array.isArray(v) ? v : Array.isArray((v as { value?: unknown[] } | undefined)?.value) ? ((v as { value: unknown[] }).value) : []);
const join = (dir: string, file: string): string => `${dir.replace(/[\\/]+$/, '')}/${file}`;

export async function runDiscovery(client: AzureReadOnlyClient, input: DiscoveryInput, io: DiscoveryIO): Promise<DiscoveryResult> {
  const san: SanitizeOptions = { mask: input.mask, organization: input.organization, pat: input.pat };
  const files: string[] = [];
  const data: DiscoveryData = { workItem: undefined, notes: [] };

  const save = async (path: string, content: string): Promise<void> => {
    assertNoSecret(content, input.pat);
    await io.write(path, content);
    files.push(path);
    io.log(`gravado: ${path}`);
  };
  const saveJson = (file: string, value: unknown): Promise<void> =>
    save(join(input.outDir, file), JSON.stringify(sanitize(value, san), null, 2) + '\n');
  const optional = async <T>(label: string, fn: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await fn();
    } catch (e) {
      data.notes.push(`${label}: ${(e as Error).message}`);
      io.log(`aviso: ${label}: ${(e as Error).message}`);
      return undefined;
    }
  };

  // A) demanda (obrigatória)
  data.workItem = (await client.get(`wit/workitems/${input.workItemId}`, { query: { $expand: 'all' } })).data;
  await saveJson('work-item.json', data.workItem);

  // extras de descoberta (somente GET)
  data.relationTypes = await optional('relation types', async () => (await client.get('wit/workitemrelationtypes', { scope: 'organization' })).data);
  if (data.relationTypes) await saveJson('relation-types.json', data.relationTypes);

  // B) Test Plan
  let exitCode: 0 | 2 = 0;
  if (input.planId === undefined) {
    data.plansList = await optional('lista de planos', () => client.getPaged('testplan/plans', { query: { includePlanDetails: true } }));
    if (data.plansList) await saveJson('test-plans-list.json', data.plansList);
    data.notes.push('Nenhum --plan informado: gravei a lista de planos. Rode novamente com --plan <ID> (e --suite / --test-case).');
    exitCode = 2;
  } else {
    data.plan = (await client.get(`testplan/plans/${input.planId}`)).data;
    await saveJson('test-plan.json', data.plan);

    // C) árvore de suítes (árvore e lista plana, para comparar)
    const tree = await optional('árvore de suítes', () => client.getPaged(`testplan/Plans/${input.planId}/suites`, { query: { asTreeView: true, expand: 'children' } }));
    const flat = await optional('lista plana de suítes', () => client.getPaged(`testplan/Plans/${input.planId}/suites`, { query: { asTreeView: false } }));
    data.suitesTree = tree;
    data.suitesFlat = flat;
    await saveJson('test-suites.json', { tree, flat, summary: flattenSuites(tree ?? flat) });
  }

  // D) Test Case real
  let testCaseId = input.testCaseId;
  if (testCaseId === undefined && input.planId !== undefined && input.suiteId !== undefined) {
    const list = await optional('Test Cases da suíte', () => client.getPaged(`testplan/Plans/${input.planId}/Suites/${input.suiteId}/TestCase`));
    if (list) {
      await saveJson('suite-test-cases.json', list);
      const first = (list[0] as { workItem?: { id?: number } } | undefined)?.workItem?.id;
      if (typeof first === 'number') {
        testCaseId = first;
        data.notes.push(`--test-case não informado: usei o primeiro Test Case da suíte (${first}).`);
      } else data.notes.push('A suíte informada não retornou Test Cases.');
    }
  }
  if (testCaseId !== undefined) {
    data.testCase = (await client.get(`wit/workitems/${testCaseId}`, { query: { $expand: 'all' } })).data;
    await saveJson('test-case.json', data.testCase);
    data.testCaseSuites = await optional('suítes do Test Case', async () => (await client.get('testplan/suites', { scope: 'organization', query: { testCaseId } })).data);
    if (data.testCaseSuites) await saveJson('test-case-suites.json', data.testCaseSuites);
    const typeName = ((data.testCase as { fields?: Record<string, unknown> }).fields?.['System.WorkItemType'] as string | undefined) ?? 'Test Case';
    const typeRaw = await optional('metadados dos campos do tipo Test Case', async () => (await client.get(`wit/workitemtypes/${encodeURIComponent(typeName)}/fields`, { query: { $expand: 'all' } })).data);
    // type/readOnly/supportedOperations não vêm no endpoint por tipo: estão no catálogo de campos
    const catalogRaw = await optional('catálogo de campos (type/readOnly)', async () => (await client.get('wit/fields')).data);
    data.testCaseTypeFields = typeRaw;
    const wanted = new Set<string>([
      ...listOf(typeRaw).map((x) => String((x as { referenceName?: string }).referenceName)),
      ...Object.keys((data.testCase as { fields?: Record<string, unknown> }).fields ?? {}),
    ]);
    data.testCaseFieldCatalog = catalogRaw ? listOf(catalogRaw).filter((x) => wanted.has(String((x as { referenceName?: string }).referenceName))) : undefined;
    if (typeRaw || data.testCaseFieldCatalog) await saveJson('test-case-fields.json', { typeFields: typeRaw, catalog: data.testCaseFieldCatalog });
    await saveJson('test-case-field-usage.json', buildFieldUsage(data));
  } else if (input.planId !== undefined) {
    data.notes.push('Nenhum Test Case coletado: informe --test-case ou --suite.');
  }

  // relatório (dados já sanitizados)
  const clean = sanitize(data, san) as DiscoveryData;
  const report = buildReport(clean, { project: input.project, generatedAt: io.now().toISOString(), masked: input.mask, samples: input.samples });
  await save(input.reportPath, report);
  return { exitCode, files, data };
}
