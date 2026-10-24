import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeSource = fs.readFileSync(path.join(projectRoot, 'runtime/v8/euclid_core.js'), 'utf8');

test('VibeEuclid runtime emits the configured Euclidean note pattern', () => {
  const events = [];
  const context = {
    outlet: (outlet, value) => events.push({ outlet, value }),
    setinletassist: () => {},
    setoutletassist: () => {}
  };

  vm.runInNewContext(runtimeSource, context);
  for (let index = 0; index < 16; index += 1) {
    context.bang();
  }

  const notes = events.filter(event => event.outlet === 0).map(event => Array.from(event.value));
  assert.deepEqual(notes, [[48, 100], [48, 100], [48, 100], [48, 100], [48, 100]]);
});

test('VibeEuclid runtime updates its pattern from parameter messages', () => {
  const events = [];
  const context = {
    outlet: (outlet, value) => events.push({ outlet, value }),
    setinletassist: () => {},
    setoutletassist: () => {}
  };

  vm.runInNewContext(runtimeSource, context);
  context.steps(8);
  context.hits(2);
  context.reset();
  events.length = 0;
  for (let index = 0; index < 8; index += 1) {
    context.bang();
  }

  const notes = events.filter(event => event.outlet === 0).map(event => Array.from(event.value));
  assert.equal(notes.length, 2);
});
