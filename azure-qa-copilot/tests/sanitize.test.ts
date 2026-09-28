import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertNoSecret, sanitize } from '../src/discovery/sanitize.js';
import { ORG, PAT, workItem } from './fixtures.js';

const base = { organization: ORG, pat: PAT };

test('mask oculta identidades, e-mails e organização', () => {
  const out = JSON.stringify(sanitize(workItem, { ...base, mask: true }));
  assert.ok(!out.includes('Fulano'));
  assert.ok(!out.includes('@empresa.com'));
  assert.ok(!out.includes(ORG));
  assert.ok(out.includes('{organization}'));
});

test('sem mask preserva os dados', () => {
  const out = JSON.stringify(sanitize(workItem, { ...base, mask: false }));
  assert.ok(out.includes('Fulano de Tal'));
});

test('o PAT é sempre removido, mesmo sem mask', () => {
  const out = JSON.stringify(sanitize({ a: `x ${PAT} y` }, { ...base, mask: false }));
  assert.ok(!out.includes(PAT));
  assert.ok(out.includes('[REDACTED]'));
});

test('assertNoSecret aborta se o PAT aparecer', () => {
  assert.throws(() => assertNoSecret(`abc ${PAT}`, PAT), /PAT/);
  assert.doesNotThrow(() => assertNoSecret('abc', PAT));
});
