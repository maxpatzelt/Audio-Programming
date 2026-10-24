import test from 'node:test';
import assert from 'node:assert/strict';
import { Patcher } from '../src/core/patcher.js';
import { Box } from '../src/core/box.js';
import { UI_UNITS } from '../src/core/constants.js';

test('Patcher: basic box creation and lookup', () => {
  const p = new Patcher({ name: 'Test' });
  const b1 = p.newobj('cycle~ 440');
  const b2 = p.liveDial('Frequency', { min: 20, max: 20000, initial: 440 });

  assert.equal(p.boxes.length, 2);
  assert.equal(p.findBox(b1.id), b1);
  assert.equal(p.findBox('frequency'), b2);
});

test('Patcher: connection validation catches out of bounds ports', () => {
  const p = new Patcher();
  const b1 = p.newobj('sig~ 1', { numoutlets: 1 });
  const b2 = p.newobj('+~', { numinlets: 2 });

  // Valid connection
  p.connect(b1, 0, b2, 0);
  assert.equal(p.lines.length, 1);

  // Invalid outlet
  assert.throws(() => {
    p.connect(b1, 5, b2, 0);
  }, /Source outlet index out of range/);

  // Invalid inlet
  assert.throws(() => {
    p.connect(b1, 0, b2, 9);
  }, /Destination inlet index out of range/);
});

test('Patcher: presentation layout auto-advances', () => {
  const p = new Patcher();
  const d1 = p.liveDial('D1');
  const d2 = p.liveDial('D2');

  assert.ok(d1.presentation_rect[0] < d2.presentation_rect[0]);
  assert.equal(d1.presentation, 1);
  assert.equal(d2.presentation, 1);
});

test('Patcher: full integrity validation', () => {
  const p = new Patcher();
  const b1 = p.newobj('cycle~ 440');
  const b2 = p.newobj('lores~');
  p.connect(b1, 0, b2, 0);

  const res = p.validate();
  assert.ok(res.valid);
  assert.equal(res.errors.length, 0);

  // Check JSON generation
  const json = p.toJSON();
  assert.ok(json.patcher);
  assert.equal(json.patcher.boxes.length, 2);
  assert.equal(json.patcher.lines.length, 1);
});
