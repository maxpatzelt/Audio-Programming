import { Box } from '../core/box.js';
import { UI_UNITS } from '../core/constants.js';
import { M4LAudioEffect } from '../templates/audio-effect.js';

const SYNC_DIVISIONS = ['64n', '32n', '16n', '8n', '4n', '2n', '1n'];

function addUiBox(patcher, maxclass, options = {}) {
  const box = new Box(patcher.nextId(), {
    maxclass,
    text: options.text || '',
    numinlets: options.numinlets ?? 1,
    numoutlets: options.numoutlets ?? 1,
    outlettype: options.outlettype || [''],
    patching_rect: options.patching_rect || [0, 0, 60, 22],
    presentation: true,
    presentation_rect: options.presentation_rect || [0, 0, 60, 22],
    varname: options.varname,
    parameter_enable: options.parameter_enable,
    saved_attribute_attributes: options.saved_attribute_attributes,
    extra: options.extra || {}
  });
  return patcher.addBox(box);
}

/**
 * Binary random LFO for remote-controlling up to eight Live parameters.
 */
export function buildBinaryLfo() {
  const patcher = new M4LAudioEffect({
    name: 'BinaryLFO',
    description: 'Random binary Live parameter controller with adjustable dropout density',
    author: 'Max'
  });

  patcher.connect(patcher.plugin, 0, patcher.plugout, 0);
  patcher.connect(patcher.plugin, 1, patcher.plugout, 1);

  addUiBox(patcher, 'live.comment', {
    text: 'Binary LFO',
    numoutlets: 0,
    outlettype: [],
    varname: 'binary_lfo_title',
    patching_rect: [10, 8, 120, 20],
    presentation_rect: [10, 4, 120, 20]
  });
  addUiBox(patcher, 'live.comment', {
    text: 'Rate',
    numoutlets: 0,
    outlettype: [],
    varname: 'binary_lfo_rate_label',
    patching_rect: [10, 28, 46, 18],
    presentation_rect: [10, 62, 46, 18]
  });
  addUiBox(patcher, 'live.comment', {
    text: 'Amount',
    numoutlets: 0,
    outlettype: [],
    varname: 'binary_lfo_amount_label',
    patching_rect: [266, 28, 52, 18],
    presentation_rect: [266, 62, 52, 18]
  });
  addUiBox(patcher, 'live.comment', {
    text: '0 = min, 1 = max',
    numoutlets: 0,
    outlettype: [],
    varname: 'binary_lfo_mapping_hint',
    patching_rect: [10, 84, 120, 18],
    presentation_rect: [10, 86, 120, 18]
  });

  const rate = patcher.liveDial('Rate', {
    varname: 'binary_lfo_rate',
    shortname: 'Rate',
    min: 0.1,
    max: 20,
    initial: 2,
    unitStyle: UI_UNITS.HERTZ,
    presentation_rect: [10, 16, 48, 58]
  });
  const amount = patcher.liveDial('Amount', {
    varname: 'binary_lfo_amount',
    shortname: 'Amount',
    min: 0,
    max: 100,
    initial: 100,
    unitStyle: UI_UNITS.PERCENT,
    presentation_rect: [265, 16, 48, 58]
  });

  const timeMode = addUiBox(patcher, 'live.text', {
    varname: 'binary_lfo_time_mode',
    numoutlets: 2,
    outlettype: ['', 'symbol'],
    patching_rect: [100, 30, 48, 22],
    presentation_rect: [68, 30, 48, 22],
    extra: { mode: 1, text: 'Hz', texton: 'Sync', parameter_enable: 1 }
  });
  const syncRate = addUiBox(patcher, 'live.menu', {
    varname: 'binary_lfo_sync_rate',
    numoutlets: 3,
    outlettype: ['', '', 'float'],
    patching_rect: [155, 30, 62, 22],
    presentation_rect: [122, 30, 62, 22],
    extra: {
      items: SYNC_DIVISIONS.flatMap((division, index) => index === 0 ? [division] : [',', division]),
      parameter_enable: 1
    }
  });
  const x10 = patcher.liveToggle('x10', {
    varname: 'binary_lfo_x10',
    shortname: 'x10',
    initial: 0,
    presentation_rect: [195, 29, 20, 20]
  });
  addUiBox(patcher, 'live.comment', {
    text: 'x10',
    numoutlets: 0,
    outlettype: [],
    varname: 'binary_lfo_x10_label',
    patching_rect: [216, 27, 35, 18],
    presentation_rect: [218, 31, 32, 18]
  });

  const multimap = patcher.liveToggle('Show Multimap', {
    varname: 'binary_lfo_multimap',
    shortname: 'Multi',
    initial: 0,
    presentation_rect: [328, 30, 22, 22]
  });
  addUiBox(patcher, 'live.comment', {
    text: 'Multimap',
    numoutlets: 0,
    outlettype: [],
    varname: 'binary_lfo_multimap_label',
    patching_rect: [352, 28, 130, 18],
    presentation_rect: [352, 34, 70, 18]
  });

  const engine = patcher.v8('binary_lfo.js', {
    numinlets: 2,
    numoutlets: 1,
    outlettype: ['int'],
    patching_rect: [40, 140, 120, 22]
  });
  const metro = patcher.newobj('metro 16n @active 0', {
    numinlets: 2,
    numoutlets: 1,
    outlettype: ['bang'],
    patching_rect: [40, 100, 125, 22]
  });
  const startMetro = patcher.newobj('loadmess 1', {
    numinlets: 1,
    numoutlets: 1,
    outlettype: ['int'],
    patching_rect: [180, 100, 70, 22]
  });
  patcher.connect(startMetro, 0, metro, 0);
  patcher.connect(metro, 0, engine, 0);

  const amountPrepend = patcher.newobj('prepend amount', {
    patching_rect: [260, 100, 105, 22]
  });
  patcher.connect(amount, 0, amountPrepend, 0);
  patcher.connect(amountPrepend, 0, engine, 1);
  const initialAmount = patcher.newobj('loadmess 100', {
    patching_rect: [380, 100, 90, 22]
  });
  patcher.connect(initialAmount, 0, amountPrepend, 0);

  const hzInterval = patcher.newobj('expr 1000. / ($f1 * (1 + 9 * $f2))', {
    numinlets: 2,
    numoutlets: 1,
    outlettype: ['float'],
    patching_rect: [40, 190, 220, 22]
  });
  const hzGate = patcher.newobj('spigot', {
    numinlets: 2,
    numoutlets: 1,
    outlettype: ['float'],
    patching_rect: [40, 230, 50, 22]
  });
  const syncGate = patcher.newobj('spigot', {
    numinlets: 2,
    numoutlets: 1,
    outlettype: [''],
    patching_rect: [290, 190, 50, 22]
  });
  const modeSelect = patcher.newobj('sel 0 1', {
    numinlets: 1,
    numoutlets: 3,
    outlettype: ['', '', ''],
    patching_rect: [110, 70, 65, 22]
  });
  const invertMode = patcher.newobj('!- 1', {
    numinlets: 2,
    numoutlets: 1,
    outlettype: ['int'],
    patching_rect: [190, 70, 45, 22]
  });
  patcher.connect(rate, 0, hzInterval, 0);
  patcher.connect(x10, 0, hzInterval, 1);
  patcher.connect(hzInterval, 0, hzGate, 0);
  patcher.connect(timeMode, 0, modeSelect, 0);
  patcher.connect(timeMode, 0, invertMode, 0);
  patcher.connect(invertMode, 0, hzGate, 1);
  patcher.connect(timeMode, 0, syncGate, 1);
  patcher.connect(hzGate, 0, metro, 1);
  const divisionSelect = patcher.newobj(`sel ${SYNC_DIVISIONS.map((_, index) => index).join(' ')}`, {
    numinlets: 1,
    numoutlets: SYNC_DIVISIONS.length + 1,
    outlettype: Array(SYNC_DIVISIONS.length + 1).fill(''),
    patching_rect: [290, 230, 150, 22]
  });
  patcher.connect(syncRate, 0, divisionSelect, 0);
  SYNC_DIVISIONS.forEach((division, index) => {
    const divisionMessage = patcher.message(division, {
      patching_rect: [290 + index * 58, 270, 50, 22]
    });
    patcher.connect(divisionSelect, index, divisionMessage, 0);
    patcher.connect(divisionMessage, 0, syncGate, 0);
  });
  patcher.connect(syncGate, 0, metro, 1);

  const requestCurrentRate = patcher.message('bang', {
    patching_rect: [480, 100, 45, 22]
  });
  const requestCurrentDivision = patcher.message('bang', {
    patching_rect: [535, 100, 45, 22]
  });
  patcher.connect(modeSelect, 0, requestCurrentRate, 0);
  patcher.connect(requestCurrentRate, 0, rate, 0);
  patcher.connect(modeSelect, 1, requestCurrentDivision, 0);
  patcher.connect(requestCurrentDivision, 0, syncRate, 0);
  const mapperDisplay = patcher.newobj('thispatcher', {
    numinlets: 1,
    numoutlets: 2,
    outlettype: ['', 'symbol'],
    varname: 'binary_lfo_mapper_display',
    patching_rect: [600, 100, 80, 22]
  });
  const hideSyncMenu = patcher.message('script hide binary_lfo_sync_rate', {
    patching_rect: [480, 180, 210, 22]
  });
  const showSyncMenu = patcher.message('script show binary_lfo_sync_rate', {
    patching_rect: [480, 210, 210, 22]
  });
  patcher.connect(modeSelect, 0, hideSyncMenu, 0);
  patcher.connect(modeSelect, 1, showSyncMenu, 0);
  patcher.connect(hideSyncMenu, 0, mapperDisplay, 0);
  patcher.connect(showSyncMenu, 0, mapperDisplay, 0);
  for (const [mode, action, target] of [
    [0, 'show', 'binary_lfo_rate'],
    [0, 'show', 'binary_lfo_x10'],
    [0, 'show', 'binary_lfo_x10_label'],
    [1, 'hide', 'binary_lfo_rate'],
    [1, 'hide', 'binary_lfo_x10'],
    [1, 'hide', 'binary_lfo_x10_label']
  ]) {
    const visibilityMessage = patcher.message(`script ${action} ${target}`, {
      patching_rect: [700, 180 + (mode * 90) + (target.length * 2), 210, 22]
    });
    patcher.connect(modeSelect, mode, visibilityMessage, 0);
    patcher.connect(visibilityMessage, 0, mapperDisplay, 0);
  }
  const initialRate = patcher.newobj('loadmess 2', {
    patching_rect: [480, 140, 75, 22]
  });
  patcher.connect(initialRate, 0, rate, 0);
  const initialX10 = patcher.newobj('loadmess 0', {
    patching_rect: [565, 140, 75, 22]
  });
  patcher.connect(initialX10, 0, x10, 0);
  const initialSyncDivision = patcher.newobj('loadmess 2', {
    patching_rect: [650, 140, 75, 22]
  });
  patcher.connect(initialSyncDivision, 0, syncRate, 0);
  const initialTimeMode = patcher.newobj('loadmess 0', {
    patching_rect: [735, 140, 75, 22]
  });
  patcher.connect(initialTimeMode, 0, timeMode, 0);

  const multimapSelect = patcher.newobj('sel 0 1', {
    numinlets: 1,
    numoutlets: 3,
    outlettype: ['', '', ''],
    patching_rect: [600, 140, 65, 22]
  });
  patcher.connect(multimap, 0, multimapSelect, 0);
  const initialMultimap = patcher.newobj('loadmess 0', {
    patching_rect: [690, 140, 75, 22]
  });
  patcher.connect(initialMultimap, 0, multimapSelect, 0);

  for (let slot = 1; slot <= 8; slot += 1) {
    const rowY = 112 + (slot - 1) * 32;
    const slotLabel = addUiBox(patcher, 'live.comment', {
      text: `Slot ${slot}`,
      numoutlets: 0,
      outlettype: [],
      varname: `binary_lfo_slot_${slot}_name`,
      patching_rect: [10, rowY, 52, 18],
      presentation_rect: [10, rowY, 52, 18]
    });
    const mapButton = addUiBox(patcher, 'live.text', {
      varname: `binary_lfo_slot_${slot}_map`,
      numoutlets: 2,
      outlettype: ['', 'symbol'],
      patching_rect: [68, rowY, 42, 22],
      presentation_rect: [68, rowY, 42, 22],
      extra: { mode: 0, text: 'Map', texton: 'Map' }
    });
    const targetName = addUiBox(patcher, 'live.comment', {
      text: 'No target',
      numoutlets: 0,
      outlettype: [],
      varname: `binary_lfo_slot_${slot}_target`,
      patching_rect: [118, rowY, 130, 18],
      presentation_rect: [118, rowY, 130, 18]
    });
    const unmapButton = addUiBox(patcher, 'live.text', {
      varname: `binary_lfo_slot_${slot}_unmap`,
      numoutlets: 2,
      outlettype: ['', 'symbol'],
      patching_rect: [255, rowY, 52, 22],
      presentation_rect: [255, rowY, 52, 22],
      extra: { mode: 0, text: 'Unmap', texton: 'Unmap' }
    });
    const mapObject = patcher.newobj('live.map @strict 1', {
      numinlets: 1,
      numoutlets: 5,
      outlettype: ['', '', '', '', ''],
      varname: `binary_lfo_slot_${slot}_live_map`,
      patching_rect: [350, rowY, 100, 22]
    });
    const remote = patcher.newobj('live.remote~ @normalized 1', {
      numinlets: 2,
      numoutlets: 0,
      outlettype: [],
      varname: `binary_lfo_slot_${slot}_remote`,
      patching_rect: [465, rowY, 150, 22]
    });
    const unmapMessage = patcher.message('unmap', {
      patching_rect: [620, rowY, 50, 22]
    });
    const clearRemoteMessage = patcher.message('id 0', {
      patching_rect: [680, rowY, 45, 22]
    });
    const setTargetName = patcher.newobj('prepend set', {
      patching_rect: [735, rowY, 80, 22]
    });

    patcher.connect(mapButton, 0, mapObject, 0);
    patcher.connect(unmapButton, 0, unmapMessage, 0);
    patcher.connect(unmapButton, 0, clearRemoteMessage, 0);
    patcher.connect(unmapMessage, 0, mapObject, 0);
    patcher.connect(clearRemoteMessage, 0, remote, 1);
    patcher.connect(mapObject, 1, remote, 1);
    patcher.connect(mapObject, 2, setTargetName, 0);
    patcher.connect(setTargetName, 0, targetName, 0);
    patcher.connect(engine, 0, remote, 0);

    if (slot > 1) {
      for (const [object, suffix] of [[slotLabel, 'name'], [mapButton, 'map'], [targetName, 'target'], [unmapButton, 'unmap']]) {
        const hideMessage = patcher.message(`script hide binary_lfo_slot_${slot}_${suffix}`, {
          patching_rect: [10, 500 + slot * 20, 210, 22]
        });
        const showMessage = patcher.message(`script show binary_lfo_slot_${slot}_${suffix}`, {
          patching_rect: [230, 500 + slot * 20, 210, 22]
        });
        patcher.connect(multimapSelect, 0, hideMessage, 0);
        patcher.connect(multimapSelect, 1, showMessage, 0);
        patcher.connect(hideMessage, 0, mapperDisplay, 0);
        patcher.connect(showMessage, 0, mapperDisplay, 0);
      }
    }
  }

  return patcher;
}
