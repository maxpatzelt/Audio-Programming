import { Box } from '../core/box.js';
import { DEVICE_TYPES } from '../core/constants.js';
import { Patcher } from '../core/patcher.js';
import { MICROKORG_CCS } from './microkorg-ccs.js';

const SECTIONS = [...new Set(MICROKORG_CCS.map(parameter => parameter.section))];
const CC_NUMBERS = [...new Set(MICROKORG_CCS.map(parameter => parameter.cc))];

function addPresentationBox(patcher, maxclass, text, varname, rect, options = {}) {
  const box = new Box(patcher.nextId(), {
    maxclass,
    text,
    varname,
    numinlets: options.numinlets ?? 1,
    numoutlets: options.numoutlets ?? 1,
    outlettype: options.outlettype || [''],
    patching_rect: rect,
    presentation: true,
    presentation_rect: rect,
    extra: options.extra || {}
  });
  return patcher.addBox(box);
}

/** Builds the MicroKorg MIDI CC mapper without modifying the existing User Library AMXD. */
export function buildMicroKorgCCMapper() {
  const patcher = new Patcher({
    name: 'MicroKorgCCMapper',
    type: DEVICE_TYPES.MIDI_EFFECT,
    description: 'Map the KORG microKORG MIDI CC controls to Ableton Live parameters.',
    author: 'Max'
  });

  const midiIn = patcher.newobj('midiin', {
    numinlets: 1,
    numoutlets: 1,
    outlettype: ['int'],
    patching_rect: [30, 40, 48, 22]
  });
  const midiParse = patcher.newobj('midiparse', {
    numinlets: 1,
    numoutlets: 8,
    outlettype: ['', '', '', 'int', 'int', 'int', 'int', ''],
    patching_rect: [30, 90, 80, 22]
  });
  const midiOut = patcher.newobj('midiout', {
    numinlets: 1,
    numoutlets: 0,
    outlettype: [],
    patching_rect: [30, 140, 52, 22]
  });
  patcher.connect(midiIn, 0, midiParse, 0);
  patcher.connect(midiIn, 0, midiOut, 0);

  const sectionMenu = new Box(patcher.nextId(), {
    maxclass: 'umenu',
    varname: 'microkorg_section_menu',
    numinlets: 1,
    numoutlets: 3,
    outlettype: ['int', '', 'bang'],
    patching_rect: [130, 35, 150, 22],
    presentation: true,
    presentation_rect: [130, 35, 150, 22],
    extra: {
      items: SECTIONS.flatMap((section, index) => index === 0 ? [section] : [',', section])
    }
  });
  patcher.addBox(sectionMenu);
  const sectionLabel = addPresentationBox(patcher, 'live.comment', 'Parameter group', 'microkorg_section_label', [18, 38, 105, 18], {
    numoutlets: 0,
    outlettype: []
  });
  const title = addPresentationBox(patcher, 'live.comment', 'KORG microKORG CC Mapper', 'microkorg_mapper_title', [18, 8, 250, 20], {
    numoutlets: 0,
    outlettype: []
  });
  const patcherDisplay = patcher.newobj('thispatcher', {
    numinlets: 1,
    numoutlets: 2,
    outlettype: ['', 'symbol'],
    varname: 'microkorg_mapper_patcher',
    patching_rect: [500, 35, 80, 22]
  });
  const initialSection = patcher.newobj('loadmess 0', {
    patching_rect: [590, 35, 75, 22]
  });
  patcher.connect(initialSection, 0, sectionMenu, 0);

  const ccRoute = patcher.newobj(`route ${CC_NUMBERS.join(' ')}`, {
    varname: 'microkorg_cc_router',
    numinlets: 1,
    numoutlets: CC_NUMBERS.length + 1,
    outlettype: Array(CC_NUMBERS.length + 1).fill(''),
    patching_rect: [30, 200, 900, 22]
  });
  patcher.connect(midiParse, 2, ccRoute, 0);

  const valueScalers = new Map();
  CC_NUMBERS.forEach((cc, index) => {
    const scaler = patcher.newobj('/ 127.', {
      varname: `microkorg_cc_${cc}_normalized`,
      numinlets: 2,
      numoutlets: 1,
      outlettype: ['float'],
      patching_rect: [30 + index * 24, 245, 48, 22]
    });
    valueScalers.set(cc, scaler);
    patcher.connect(ccRoute, index, scaler, 0);
  });

  const rowsBySection = new Map(SECTIONS.map(section => [section, []]));
  for (const [index, parameter] of MICROKORG_CCS.entries()) {
    const rowIndex = rowsBySection.get(parameter.section).length;
    const rowY = 80 + rowIndex * 30;
    const rowId = `microkorg_cc_${index + 1}`;
    const labelText = `CC ${parameter.cc}  ${parameter.name}${parameter.centered ? ' (centered)' : ''}`;
    const label = addPresentationBox(patcher, 'live.comment', labelText, `${rowId}_label`, [18, rowY, 180, 20], {
      numoutlets: 0,
      outlettype: []
    });
    const mapButton = addPresentationBox(patcher, 'live.text', 'Map', `${rowId}_map`, [205, rowY - 2, 48, 22], {
      numoutlets: 2,
      outlettype: ['', 'symbol'],
      extra: { mode: 0, text: 'Map', texton: 'Map' }
    });
    const mappedName = addPresentationBox(patcher, 'live.comment', 'No target', `${rowId}_target`, [260, rowY, 170, 20], {
      numoutlets: 0,
      outlettype: []
    });
    const unmapButton = addPresentationBox(patcher, 'live.text', 'Unmap', `${rowId}_unmap`, [438, rowY - 2, 56, 22], {
      numoutlets: 2,
      outlettype: ['', 'symbol'],
      extra: { mode: 0, text: 'Unmap', texton: 'Unmap' }
    });
    const liveMap = patcher.newobj('live.map @strict 1', {
      numinlets: 1,
      numoutlets: 5,
      outlettype: ['', '', '', '', ''],
      varname: `${rowId}_live_map`,
      patching_rect: [520, 80 + index * 24, 100, 22]
    });
    const remote = patcher.newobj('live.remote~ @normalized 1', {
      numinlets: 2,
      numoutlets: 0,
      outlettype: [],
      varname: `${rowId}_remote`,
      patching_rect: [640, 80 + index * 24, 150, 22]
    });
    const beginUnmap = patcher.message('unmap', {
      patching_rect: [800, 80 + index * 24, 55, 22]
    });
    const clearRemote = patcher.message('id 0', {
      patching_rect: [870, 80 + index * 24, 42, 22]
    });
    const setMappedName = patcher.newobj('prepend set', {
      patching_rect: [930, 80 + index * 24, 80, 22]
    });

    patcher.connect(mapButton, 0, liveMap, 0);
    patcher.connect(liveMap, 1, remote, 1);
    patcher.connect(liveMap, 2, setMappedName, 0);
    patcher.connect(setMappedName, 0, mappedName, 0);
    patcher.connect(unmapButton, 0, beginUnmap, 0);
    patcher.connect(unmapButton, 0, clearRemote, 0);
    patcher.connect(beginUnmap, 0, liveMap, 0);
    patcher.connect(clearRemote, 0, remote, 1);
    patcher.connect(valueScalers.get(parameter.cc), 0, remote, 0);

    rowsBySection.get(parameter.section).push({ label, mapButton, mappedName, unmapButton });
  }

  SECTIONS.forEach((section, sectionIndex) => {
    const compareSection = patcher.newobj(`== ${sectionIndex}`, {
      numinlets: 2,
      numoutlets: 1,
      outlettype: ['int'],
      patching_rect: [30, 290 + sectionIndex * 28, 48, 22]
    });
    const visibility = patcher.newobj('sel 0 1', {
      numinlets: 1,
      numoutlets: 3,
      outlettype: ['', '', ''],
      patching_rect: [90, 290 + sectionIndex * 28, 55, 22]
    });
    patcher.connect(sectionMenu, 0, compareSection, 0);
    patcher.connect(compareSection, 0, visibility, 0);

    for (const row of rowsBySection.get(section)) {
      for (const box of [row.label, row.mapButton, row.mappedName, row.unmapButton]) {
        const hide = patcher.message(`script hide ${box.varname}`, {
          patching_rect: [160, 290 + sectionIndex * 28, 210, 22]
        });
        const show = patcher.message(`script show ${box.varname}`, {
          patching_rect: [380, 290 + sectionIndex * 28, 210, 22]
        });
        patcher.connect(visibility, 0, hide, 0);
        patcher.connect(visibility, 1, show, 0);
        patcher.connect(hide, 0, patcherDisplay, 0);
        patcher.connect(show, 0, patcherDisplay, 0);
      }
    }
  });

  return patcher;
}
