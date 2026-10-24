import test from 'node:test';
import assert from 'node:assert/strict';
import { MICROKORG_CCS } from '../src/devices/microkorg-ccs.js';
import { buildMicroKorgCCMapper } from '../src/devices/microkorg-cc-mapper.js';
import { AMXDContainer } from '../src/core/amxd.js';

test('MicroKorg CC manifest preserves all guide entries and shared CC aliases', () => {
  const uniqueNumbers = new Set(MICROKORG_CCS.map(parameter => parameter.cc));
  const counts = new Map();
  for (const parameter of MICROKORG_CCS) {
    counts.set(parameter.cc, (counts.get(parameter.cc) || 0) + 1);
    assert.ok(parameter.cc >= 0 && parameter.cc <= 127);
    assert.ok(parameter.name.length > 0);
    assert.ok(parameter.section.length > 0);
  }

  assert.equal(MICROKORG_CCS.length, 47);
  assert.equal(uniqueNumbers.size, 40);
  assert.deepEqual(
    [...counts].filter(([, count]) => count > 1).map(([cc]) => cc).sort((a, b) => a - b),
    [10, 18, 19, 21, 74, 79, 83]
  );
});

test('MicroKorg mapper creates a map slot for every entry and shares duplicate CC values', () => {
  const patcher = buildMicroKorgCCMapper();
  const validation = patcher.validate();
  assert.ok(validation.valid, `Mapper validation failed: ${validation.errors.join(', ')}`);
  assert.equal(patcher.type, 'mmmm');

  const maps = patcher.boxes.filter(box => box.text === 'live.map @strict 1');
  const remotes = patcher.boxes.filter(box => box.text === 'live.remote~ @normalized 1');
  const scalers = patcher.boxes.filter(box => box.varname?.startsWith('microkorg_cc_') && box.varname.endsWith('_normalized'));
  assert.equal(maps.length, 47);
  assert.equal(remotes.length, 47);
  assert.equal(scalers.length, 40);

  const sharedCc10 = patcher.boxes.filter(box => box.varname === 'microkorg_cc_10_normalized');
  const aliases = MICROKORG_CCS.map((parameter, index) => ({ parameter, index }))
    .filter(({ parameter }) => parameter.cc === 10);
  assert.equal(sharedCc10.length, 1);
  for (const { index } of aliases) {
    const remote = patcher.findBox(`microkorg_cc_${index + 1}_remote`);
    assert.ok(patcher.lines.some(line => line.sourceId === sharedCc10[0].id && line.destinationId === remote.id));
  }

  assert.ok(patcher.lines.some(line => line.sourceId === patcher.findBox('microkorg_cc_router').id));
  assert.ok(patcher.boxes.some(box => box.text === 'midiin'));
  assert.ok(patcher.boxes.some(box => box.text === 'midiparse'));
  assert.ok(patcher.boxes.some(box => box.text === 'midiout'));

  const unpacked = AMXDContainer.unpack(AMXDContainer.pack(patcher));
  assert.equal(unpacked.deviceType, 'mmmm');
  assert.equal(unpacked.json.patcher.boxes.length, patcher.boxes.length);
});
