import test from 'node:test';
import assert from 'node:assert/strict';
import { AMXDContainer } from '../src/core/amxd.js';
import { Patcher } from '../src/core/patcher.js';
import { DEVICE_TYPES, AMXD_HEADER } from '../src/core/constants.js';

test('AMXDContainer: packs and unpacks a minimal patcher', () => {
  const patcher = new Patcher({ name: 'TestAudio', type: DEVICE_TYPES.AUDIO_EFFECT });
  patcher.newobj('plugin~', { numoutlets: 2 });
  patcher.newobj('plugout~', { numinlets: 2 });

  const packed = AMXDContainer.pack(patcher);
  assert.ok(Buffer.isBuffer(packed));
  assert.ok(packed.length > AMXD_HEADER.HEADER_SIZE);

  // Check header
  assert.equal(packed.subarray(0, 4).toString('ascii'), 'ampf');
  assert.equal(packed.subarray(8, 12).toString('ascii'), 'aaaa');
  assert.equal(packed.subarray(12, 16).toString('ascii'), 'meta');
  assert.equal(packed.subarray(24, 28).toString('ascii'), 'ptch');

  // Unpack
  const unpacked = AMXDContainer.unpack(packed);
  assert.equal(unpacked.deviceType, 'aaaa');
  assert.equal(unpacked.json.patcher.fileversion, 1);
  assert.equal(unpacked.json.patcher.boxes.length, 2);
});

test('AMXDContainer: supports MIDI and Instrument device types', () => {
  const midiPatcher = new Patcher({ name: 'TestMidi', type: DEVICE_TYPES.MIDI_EFFECT });
  const midiBuffer = AMXDContainer.pack(midiPatcher);
  const unpackedMidi = AMXDContainer.unpack(midiBuffer);
  assert.equal(unpackedMidi.deviceType, 'mmmm');

  const instPatcher = new Patcher({ name: 'TestInst', type: DEVICE_TYPES.INSTRUMENT });
  const instBuffer = AMXDContainer.pack(instPatcher);
  const unpackedInst = AMXDContainer.unpack(instBuffer);
  assert.equal(unpackedInst.deviceType, 'iiii');
});

test('AMXDContainer: rejects invalid or truncated buffers', () => {
  assert.throws(() => {
    AMXDContainer.unpack(Buffer.alloc(10));
  }, /Buffer too short/);

  assert.throws(() => {
    const corrupt = Buffer.alloc(40);
    corrupt.write('bad!', 0, 4, 'ascii');
    AMXDContainer.unpack(corrupt);
  }, /Invalid AMXD magic/);
});
