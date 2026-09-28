import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AzureApiError, AzureReadOnlyClient } from '../src/azure/client.js';
import { makeFetch, ORG, PAT, type Call } from './fixtures.js';

const cfg = { organization: ORG, project: 'proj', pat: PAT };

test('monta URL de projeto e de organização com api-version 7.1', () => {
  const c = new AzureReadOnlyClient(cfg);
  assert.equal(c.buildUrl('wit/workitems/1', { query: { $expand: 'all' } }), `https://dev.azure.com/${ORG}/proj/_apis/wit/workitems/1?%24expand=all&api-version=7.1`);
  assert.equal(c.buildUrl('wit/workitemrelationtypes', { scope: 'organization' }), `https://dev.azure.com/${ORG}/_apis/wit/workitemrelationtypes?api-version=7.1`);
});

test('só usa GET e envia o PAT em Basic', async () => {
  const calls: Call[] = [];
  const c = new AzureReadOnlyClient({ ...cfg, fetchImpl: makeFetch({}, calls) });
  await c.get('wit/workitems/100');
  assert.equal(calls[0]?.method, 'GET');
  assert.equal(calls[0]?.auth, `Basic ${Buffer.from(`:${PAT}`).toString('base64')}`);
  assert.ok(!calls[0]?.url.includes(PAT), 'PAT não pode ir na URL');
});

test('não expõe método de escrita', () => {
  const c = new AzureReadOnlyClient(cfg) as unknown as Record<string, unknown>;
  for (const m of ['post', 'patch', 'put', 'delete', 'request']) assert.equal(c[m], undefined);
});

test('erros trazem dica e nunca o PAT', async () => {
  const c = new AzureReadOnlyClient({ ...cfg, fetchImpl: makeFetch() });
  await assert.rejects(c.get('wit/workitems/999'), (e: unknown) => {
    assert.ok(e instanceof AzureApiError);
    assert.equal(e.status, 404);
    assert.ok(!e.message.includes(PAT));
    return true;
  });
});

test('resposta não-JSON vira erro claro', async () => {
  const f = (async () => new Response('<html>login</html>', { status: 200, headers: { 'content-type': 'text/html' } })) as typeof fetch;
  const c = new AzureReadOnlyClient({ ...cfg, fetchImpl: f });
  await assert.rejects(c.get('wit/workitems/1'), /não-JSON/);
});

test('paginação segue x-ms-continuationtoken', async () => {
  let n = 0;
  const f = (async (u: string | URL | Request) => {
    n++;
    const tok = new URL(String(u)).searchParams.get('continuationToken');
    const body = tok ? { value: [{ id: 2 }] } : { value: [{ id: 1 }] };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json', ...(tok ? {} : { 'x-ms-continuationtoken': 'abc' }) } });
  }) as typeof fetch;
  const c = new AzureReadOnlyClient({ ...cfg, fetchImpl: f });
  const items = await c.getPaged('testplan/plans');
  assert.deepEqual(items, [{ id: 1 }, { id: 2 }]);
  assert.equal(n, 2);
});
