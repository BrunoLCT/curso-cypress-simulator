import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AzureReadOnlyClient } from '../src/azure/client.js';
import { runDiscovery, type DiscoveryInput } from '../src/discovery/run.js';
import { makeFetch, ORG, PAT, type Call } from './fixtures.js';

function setup(over: Partial<DiscoveryInput> = {}, routes: Record<string, unknown> = {}) {
  const calls: Call[] = [];
  const written = new Map<string, string>();
  const client = new AzureReadOnlyClient({ organization: ORG, project: 'proj', pat: PAT, fetchImpl: makeFetch(routes, calls) });
  const input: DiscoveryInput = { workItemId: 100, planId: 7, suiteId: 3, outDir: 'discovery', reportPath: 'docs/DESCOBERTA.md', mask: false, samples: true, organization: ORG, project: 'proj', pat: PAT, ...over };
  const io = { write: async (p: string, c: string) => void written.set(p, c), log: () => {}, now: () => new Date('2026-01-01T00:00:00Z') };
  return { calls, written, run: () => runDiscovery(client, input, io) };
}

test('fluxo completo: só GET, arquivos esperados e sem PAT', async () => {
  const { calls, written, run } = setup();
  const r = await run();
  assert.equal(r.exitCode, 0);
  assert.ok(calls.length > 0);
  assert.ok(calls.every((c) => c.method === 'GET'), 'toda chamada deve ser GET');
  for (const f of ['work-item.json', 'test-plan.json', 'test-suites.json', 'test-case.json']) assert.ok(written.has(`discovery/${f}`), f);
  assert.ok(written.has('docs/DESCOBERTA.md'));
  for (const [, content] of written) assert.ok(!content.includes(PAT));
});

test('usa o primeiro Test Case da suíte quando --test-case não é informado', async () => {
  const { written, run } = setup();
  await run();
  assert.equal(JSON.parse(written.get('discovery/test-case.json') ?? '{}').id, 200);
});

test('relatório detecta suíte requirement-based, vínculo e steps', async () => {
  const { written, run } = setup();
  await run();
  const md = written.get('docs/DESCOBERTA.md') ?? '';
  assert.match(md, /Apontando para a demanda 100: \*\*1\*\*/);
  assert.match(md, /Links diretos: 1/);
  assert.match(md, /Steps: campo presente[^|]*\| sim \/ 2/);
  assert.match(md, /## 5\. Metadados dos campos do Test Case/);
  assert.ok(!/## 5\. Campos obrigatórios/.test(md));
});

test('sem --plan: lista planos, grava e retorna código 2', async () => {
  const { written, run } = setup({ planId: undefined, suiteId: undefined });
  const r = await run();
  assert.equal(r.exitCode, 2);
  assert.ok(written.has('discovery/test-plans-list.json'));
  assert.ok(!written.has('discovery/test-suites.json'));
});

test('--mask remove identidades dos arquivos e do relatório', async () => {
  const { written, run } = setup({ mask: true });
  await run();
  for (const [, c] of written) {
    assert.ok(!c.includes('Fulano'));
    assert.ok(!c.includes('@empresa.com'));
  }
});

test('--no-samples omite títulos e trechos do relatório', async () => {
  const { written, run } = setup({ samples: false });
  await run();
  const md = written.get('docs/DESCOBERTA.md') ?? '';
  assert.ok(!md.includes('CT01 exemplo'));
  assert.ok(!md.includes('```xml'));
});

test('falha opcional vira aviso no relatório; falha da demanda aborta', async () => {
  const opt = setup({}, { 'organization:wit/workitemrelationtypes': undefined });
  const r = await opt.run();
  assert.equal(r.exitCode, 0);
  assert.ok(r.data.notes.some((n) => n.startsWith('relation types:')));
  assert.match(opt.written.get('docs/DESCOBERTA.md') ?? '', /Avisos da execução/);
  await assert.rejects(setup({ workItemId: 999 }).run(), /404/);
});

test('metadados de campos: type/readOnly vêm do catálogo; obrigatoriedade nunca é dada como confirmada', async () => {
  const { written, run } = setup();
  await run();
  const usage = JSON.parse(written.get('discovery/test-case-field-usage.json') ?? '[]') as Array<Record<string, unknown>>;
  const by = (r: string) => usage.find((u) => u.referenceName === r);
  assert.equal(by('System.Title')?.type, 'string');
  assert.equal(by('System.Title')?.readOnly, false);
  assert.equal(by('System.Title')?.alwaysRequiredPerMetadata, true);
  assert.equal(by('System.Title')?.requiredStatus, 'indicado-pelo-metadado');
  assert.equal(by('System.Title')?.filledInRealTestCase, true);
  assert.equal(by('System.Reason')?.filledInRealTestCase, false, 'campo do tipo, mas vazio no Test Case real');
  assert.equal(by('Microsoft.VSTS.Common.Priority')?.allowedValuesCount, 4);
  assert.equal(by('Microsoft.VSTS.Common.Priority')?.hasDefaultValue, true);
  assert.ok(usage.every((u) => u.confirmedRequired === false), 'nenhum campo pode sair como obrigatório confirmado');
  const fields = JSON.parse(written.get('discovery/test-case-fields.json') ?? '{}') as { typeFields?: unknown; catalog?: Array<{ referenceName: string }> };
  assert.ok(fields.typeFields && fields.catalog, 'test-case-fields.json guarda metadados (tipo + catálogo)');
  assert.ok(!fields.catalog?.some((c) => c.referenceName === 'Outro.Campo'), 'catálogo filtrado pelos campos do Test Case');
  const md = written.get('docs/DESCOBERTA.md') ?? '';
  assert.match(md, /não comprovado/);
  assert.ok(!/obrigatório confirmado \| sim/i.test(md));
});

test('falha do catálogo vira aviso e não derruba a descoberta', async () => {
  const { written, run } = setup({}, { 'project:wit/fields': undefined });
  const r = await run();
  assert.equal(r.exitCode, 0);
  assert.ok(r.data.notes.some((n) => n.startsWith('catálogo de campos')));
  assert.ok(written.has('discovery/test-case-field-usage.json'));
});
