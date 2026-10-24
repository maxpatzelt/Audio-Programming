import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVibeDelay } from '../src/devices/vibe-delay.js';
import { buildVibeEuclid } from '../src/devices/vibe-euclid.js';
import { buildBinaryLfo } from '../src/devices/binary-lfo.js';
import { AMXDContainer } from '../src/core/amxd.js';

test('Device Prototype: VibeDelay builds and validates', () => {
  const delay = buildVibeDelay();
  const val = delay.validate();

  assert.ok(val.valid, `VibeDelay validation failed: ${val.errors.join(', ')}`);
  assert.equal(delay.type, 'aaaa');
  assert.ok(delay.boxes.length >= 25);
  assert.ok(delay.lines.length >= 30);

  // Check audio endpoints
  assert.ok(delay.findBox('plugin~') || delay.boxes.some(b => b.text === 'plugin~'));
  assert.ok(delay.findBox('plugout~') || delay.boxes.some(b => b.text === 'plugout~'));

  // Test packing to binary AMXD
  const buffer = AMXDContainer.pack(delay);
  const unpacked = AMXDContainer.unpack(buffer);
  assert.equal(unpacked.deviceType, 'aaaa');
  assert.equal(unpacked.json.patcher.openinpresentation, 1);
});

test('Device Prototype: VibeEuclid builds and validates', () => {
  const euclid = buildVibeEuclid();
  const val = euclid.validate();

  assert.ok(val.valid, `VibeEuclid validation failed: ${val.errors.join(', ')}`);
  assert.equal(euclid.type, 'mmmm');
  assert.ok(euclid.boxes.length >= 15);
  assert.ok(euclid.lines.length >= 15);

  // Check MIDI endpoints and JS engine
  assert.ok(euclid.boxes.some(b => b.text === 'midiin'));
  assert.ok(euclid.boxes.some(b => b.text === 'midiout'));
  assert.ok(euclid.boxes.some(b => b.text === 'v8 euclid_core.js'));
  assert.ok(euclid.boxes.some(b => b.text === 'loadmess 1'));
  assert.ok(euclid.boxes.some(b => b.text === 'pack 0 0'));

  // Test packing to binary AMXD
  const buffer = AMXDContainer.pack(euclid);
  const unpacked = AMXDContainer.unpack(buffer);
  assert.equal(unpacked.deviceType, 'mmmm');
  assert.equal(unpacked.json.patcher.openinpresentation, 1);
});

test('Device Prototype: BinaryLFO builds eight normalized remote map slots', () => {
  const binaryLfo = buildBinaryLfo();
  const validation = binaryLfo.validate();

  assert.ok(validation.valid, `BinaryLFO validation failed: ${validation.errors.join(', ')}`);
  assert.equal(binaryLfo.type, 'aaaa');
  assert.equal(binaryLfo.boxes.filter(box => box.text.startsWith('live.remote~ @normalized 1')).length, 8);
  assert.equal(binaryLfo.boxes.filter(box => box.text === 'live.map @strict 1').length, 8);
  assert.ok(binaryLfo.boxes.some(box => box.text === 'metro 16n @active 0'));
  assert.ok(binaryLfo.boxes.some(box => box.text === 'live.v8 binary_lfo.js' || box.text === 'v8 binary_lfo.js'));
  assert.ok(binaryLfo.boxes.some(box => box.varname === 'binary_lfo_amount'));
  assert.ok(binaryLfo.boxes.some(box => box.varname === 'binary_lfo_x10'));
  assert.ok(binaryLfo.boxes.some(box => box.varname === 'binary_lfo_multimap'));
  assert.ok(!binaryLfo.boxes.some(box => /offset|depth|jitter|smooth|waveform/i.test(box.text)));

  const buffer = AMXDContainer.pack(binaryLfo);
  const unpacked = AMXDContainer.unpack(buffer);
  assert.equal(unpacked.deviceType, 'aaaa');
  assert.equal(unpacked.json.patcher.boxes.length, binaryLfo.boxes.length);
});
