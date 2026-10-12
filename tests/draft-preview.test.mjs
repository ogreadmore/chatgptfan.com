import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('Draft preview cannot enter a normal build or select a nonexistent edition', () => {
  const run = args => spawnSync(process.execPath, ['scripts/build.mjs', ...args], {encoding:'utf8'});
  const normal = run(['--draft-preview=2099-01-01']);
  assert.equal(normal.status, 1);
  assert.match(normal.stderr, /Draft preview requires --art-preview/);
  const missing = run(['--art-preview', '--draft-preview=2099-01-01']);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Draft preview must identify an existing draft/);
});
