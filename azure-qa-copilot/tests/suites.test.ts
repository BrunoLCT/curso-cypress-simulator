import assert from 'node:assert/strict';
import { test } from 'node:test';
import { flattenSuites } from '../src/discovery/suites.js';
import { suitesTree } from './fixtures.js';

test('achata a árvore com caminho, tipo e requirementId', () => {
  const rows = flattenSuites(suitesTree);
  assert.equal(rows.length, 3);
  const leaf = rows.find((r) => r.id === 3);
  assert.equal(leaf?.path, 'Plano 2026 / Sprint 10 / 100 - US teste da trava');
  assert.equal(leaf?.suiteType, 'requirementTestSuite');
  assert.equal(leaf?.requirementId, 100);
  assert.equal(leaf?.depth, 2);
});

test('aceita lista plana com parentSuite', () => {
  const rows = flattenSuites([{ id: 1, name: 'A' }, { id: 2, name: 'B', parentSuite: { id: 1 } }]);
  assert.equal(rows.find((r) => r.id === 2)?.path, 'A / B');
});
