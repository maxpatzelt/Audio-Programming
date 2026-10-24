import { M4LMidiEffect } from '../templates/midi-effect.js';
import { UI_UNITS } from '../core/constants.js';

/**
 * Builds the VibeEuclid Max for Live MIDI Effect.
 * Algorithmic Euclidean rhythm generator running via Max 9's V8 JavaScript engine.
 */
export function buildVibeEuclid() {
  const patcher = new M4LMidiEffect({
    name: 'VibeEuclid',
    description: 'Algorithmic Euclidean MIDI Sequencer using Max 9 V8 JS engine',
    author: 'Max'
  });

  // Presentation Layout coordinates
  let uiX = 10;
  const nextUiRect = (width = 44, height = 50) => {
    const rect = [uiX, 15, width, height];
    uiX += width + 10;
    return rect;
  };

  // --- UI Controls (Presentation Mode) ---
  const runToggle = patcher.liveToggle('Run', {
    varname: 'run',
    shortname: 'Run',
    initial: 1,
    presentation_rect: [uiX, 25, 30, 24]
  });
  uiX += 40;

  const stepsDial = patcher.liveDial('Steps', {
    varname: 'steps',
    shortname: 'Steps',
    min: 1,
    max: 32,
    initial: 16,
    unitStyle: UI_UNITS.INT,
    type: 'int',
    presentation_rect: nextUiRect()
  });

  const hitsDial = patcher.liveDial('Hits', {
    varname: 'hits',
    shortname: 'Hits',
    min: 0,
    max: 32,
    initial: 5,
    unitStyle: UI_UNITS.INT,
    type: 'int',
    presentation_rect: nextUiRect()
  });

  const rotateDial = patcher.liveDial('Rotate', {
    varname: 'rotate',
    shortname: 'Rotate',
    min: 0,
    max: 31,
    initial: 0,
    unitStyle: UI_UNITS.INT,
    type: 'int',
    presentation_rect: nextUiRect()
  });

  const noteDial = patcher.liveDial('Pitch', {
    varname: 'pitch',
    shortname: 'Pitch',
    min: 24,
    max: 96,
    initial: 48,
    unitStyle: UI_UNITS.MIDI_NOTE,
    type: 'int',
    presentation_rect: nextUiRect()
  });

  const velDial = patcher.liveDial('Velocity', {
    varname: 'velocity',
    shortname: 'Vel',
    min: 1,
    max: 127,
    initial: 100,
    unitStyle: UI_UNITS.INT,
    type: 'int',
    presentation_rect: nextUiRect()
  });

  const divisionDial = patcher.liveDial('Gate (ms)', {
    varname: 'gate',
    shortname: 'Gate',
    min: 20,
    max: 500,
    initial: 120,
    unitStyle: UI_UNITS.TIME_MS,
    type: 'int',
    presentation_rect: nextUiRect()
  });

  // --- Clock & Generator Engine ---
  // metro synced to Live transport: metro 16n @active 1
  const metro = patcher.newobj('metro 16n @active 0', {
    numinlets: 2,
    numoutlets: 1,
    outlettype: ['bang'],
    patching_rect: [180, 100, 110, 22]
  });
  const startOnLoad = patcher.newobj('loadmess 1', {
    numinlets: 1,
    numoutlets: 1,
    outlettype: ['int'],
    patching_rect: [110, 100, 70, 22]
  });
  patcher.connect(startOnLoad, 0, metro, 0);
  patcher.connect(runToggle, 0, metro, 0);

  // Max 9 V8 object running euclid_core.js
  const v8Engine = patcher.v8('euclid_core.js', {
    numinlets: 2,
    numoutlets: 2,
    outlettype: ['', ''],
    patching_rect: [180, 200, 140, 22]
  });

  // Clock pulse to inlet 0
  patcher.connect(metro, 0, v8Engine, 0);

  // Parameter prepends to inlet 1
  const prepSteps = patcher.newobj('prepend steps', { patching_rect: [280, 140, 80, 22] });
  const prepHits = patcher.newobj('prepend hits', { patching_rect: [370, 140, 75, 22] });
  const prepRotate = patcher.newobj('prepend rotate', { patching_rect: [455, 140, 80, 22] });
  const prepNote = patcher.newobj('prepend note', { patching_rect: [545, 140, 75, 22] });
  const prepVel = patcher.newobj('prepend velocity', { patching_rect: [630, 140, 90, 22] });
  const prepGate = patcher.newobj('prepend gate', { patching_rect: [730, 140, 75, 22] });

  patcher.connect(stepsDial, 0, prepSteps, 0);
  patcher.connect(hitsDial, 0, prepHits, 0);
  patcher.connect(rotateDial, 0, prepRotate, 0);
  patcher.connect(noteDial, 0, prepNote, 0);
  patcher.connect(velDial, 0, prepVel, 0);
  patcher.connect(divisionDial, 0, prepGate, 0);

  patcher.connect(prepSteps, 0, v8Engine, 1);
  patcher.connect(prepHits, 0, v8Engine, 1);
  patcher.connect(prepRotate, 0, v8Engine, 1);
  patcher.connect(prepNote, 0, v8Engine, 1);
  patcher.connect(prepVel, 0, v8Engine, 1);
  patcher.connect(prepGate, 0, v8Engine, 1);

  // Unpack note [pitch, vel] from v8Engine outlet 0
  const unpackNote = patcher.newobj('unpack 0 0', {
    numinlets: 1,
    numoutlets: 2,
    outlettype: ['int', 'int'],
    patching_rect: [180, 250, 70, 22]
  });
  patcher.connect(v8Engine, 0, unpackNote, 0);

  // makenote handles duration / note-off timing
  const makeNote = patcher.newobj('makenote 100 120', {
    numinlets: 3,
    numoutlets: 2,
    outlettype: ['float', 'float'],
    patching_rect: [180, 290, 100, 22]
  });
  patcher.connect(unpackNote, 0, makeNote, 0); // pitch
  patcher.connect(unpackNote, 1, makeNote, 1); // velocity
  patcher.connect(divisionDial, 0, makeNote, 2); // gate duration

  // midiformat's left inlet accepts a pitch/velocity list for note messages.
  const notePair = patcher.newobj('pack 0 0', {
    numinlets: 2,
    numoutlets: 1,
    outlettype: ['list'],
    patching_rect: [180, 330, 70, 22]
  });
  patcher.connect(makeNote, 0, notePair, 0);
  patcher.connect(makeNote, 1, notePair, 1);
  patcher.connect(notePair, 0, patcher.midiformat, 0);

  return patcher;
}
