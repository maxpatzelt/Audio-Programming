import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeSource = fs.readFileSync(path.join(projectRoot, 'runtime/v8/binary_lfo.js'), 'utf8');

function createRuntime(randomValues) {
  const events = [];
  let randomIndex = 0;
  const testMath = Object.create(Math);
  testMath.random = () => randomValues[randomIndex++ % randomValues.length];
  const context = {
    Math: testMath,
    outlet: (outlet, value) => events.push({ outlet, value }),
    setinletassist: () => {},
    setoutletassist: () => {},
    inlet: 0
  };
  vm.runInNewContext(runtimeSource, context);
  return { context, events };
}

test('Binary LFO Amount 0 suppresses every high event', () => {
  const { context, events } = createRuntime([0, 0]);
  context.inlet = 1;
  context.msg_int(0);
  context.inlet = 0;
  context.bang();

  assert.deepEqual(events.map(event => event.value), [0]);
});

test('Binary LFO Amount 100 preserves the randomized binary pattern', () => {
  const { context, events } = createRuntime([0.1, 0.9, 0.8]);
  context.amount(100);
  context.bang();
  context.bang();

  assert.deepEqual(events.map(event => event.value), [1, 0]);
});

test('Binary LFO Amount proportionally drops base high events', () => {
  const { context, events } = createRuntime([0.1, 0.4, 0.1, 0.8]);
  context.amount(50);
  context.bang();
  context.bang();

  assert.deepEqual(events.map(event => event.value), [0, 1]);
});
