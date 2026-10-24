import { M4LAudioEffect } from '../templates/audio-effect.js';
import { UI_UNITS } from '../core/constants.js';

/**
 * Builds the VibeDelay Max for Live Audio Effect.
 * A stereo drift delay with modulated LFO, resonant lowpass filter, feedback, and dry/wet control.
 */
export function buildVibeDelay() {
  const patcher = new M4LAudioEffect({
    name: 'VibeDelay',
    description: 'Stereo Drift Delay with LFO modulation and filter built via Code-First M4L',
    author: 'Max'
  });

  // Presentation Layout coordinates: 15px top, 60px intervals
  let uiX = 10;
  const nextUiRect = (width = 48) => {
    const rect = [uiX, 15, width, 55];
    uiX += width + 10;
    return rect;
  };

  // --- UI Controls (Presentation Mode for Ableton Device Rack) ---
  const timeDial = patcher.liveDial('Delay Time', {
    varname: 'delay_time',
    shortname: 'Time',
    min: 1,
    max: 2000,
    initial: 350,
    unitStyle: UI_UNITS.TIME_MS,
    presentation_rect: nextUiRect()
  });

  const feedbackDial = patcher.liveDial('Feedback', {
    varname: 'feedback',
    shortname: 'FB',
    min: 0,
    max: 95,
    initial: 45,
    unitStyle: UI_UNITS.PERCENT,
    presentation_rect: nextUiRect()
  });

  const driftRateDial = patcher.liveDial('Drift Rate', {
    varname: 'drift_rate',
    shortname: 'Rate',
    min: 0.05,
    max: 10.0,
    initial: 0.5,
    unitStyle: UI_UNITS.HERTZ,
    presentation_rect: nextUiRect()
  });

  const driftDepthDial = patcher.liveDial('Drift Depth', {
    varname: 'drift_depth',
    shortname: 'Depth',
    min: 0,
    max: 50,
    initial: 10,
    unitStyle: UI_UNITS.TIME_MS,
    presentation_rect: nextUiRect()
  });

  const cutoffDial = patcher.liveDial('Filter Cutoff', {
    varname: 'cutoff',
    shortname: 'Cutoff',
    min: 200,
    max: 18000,
    initial: 6000,
    unitStyle: UI_UNITS.HERTZ,
    presentation_rect: nextUiRect()
  });

  const dryWetDial = patcher.liveDial('Dry/Wet', {
    varname: 'dry_wet',
    shortname: 'Mix',
    min: 0,
    max: 100,
    initial: 50,
    unitStyle: UI_UNITS.PERCENT,
    presentation_rect: nextUiRect()
  });

  // --- DSP Graph ---

  // 1. Modulated Drift LFO: cycle~ -> *~ (depth) -> +~ (base time)
  const lfo = patcher.newobj('cycle~ 0.5', {
    patching_rect: [250, 80, 70, 22]
  });
  const lfoDepthSig = patcher.newobj('sig~ 10', {
    patching_rect: [330, 80, 50, 22]
  });
  const lfoScale = patcher.newobj('*~', {
    numinlets: 2,
    numoutlets: 1,
    outlettype: ['signal'],
    patching_rect: [250, 120, 32, 22]
  });
  const baseTimeSig = patcher.newobj('sig~ 350', {
    patching_rect: [400, 80, 60, 22]
  });
  const modDelayTime = patcher.newobj('+~', {
    numinlets: 2,
    numoutlets: 1,
    outlettype: ['signal'],
    patching_rect: [250, 160, 32, 22]
  });

  // Connect LFO graph
  patcher.connect(driftRateDial, 0, lfo, 0);
  patcher.connect(driftDepthDial, 0, lfoDepthSig, 0);
  patcher.connect(timeDial, 0, baseTimeSig, 0);
  patcher.connect(lfo, 0, lfoScale, 0);
  patcher.connect(lfoDepthSig, 0, lfoScale, 1);
  patcher.connect(lfoScale, 0, modDelayTime, 0);
  patcher.connect(baseTimeSig, 0, modDelayTime, 1);

  // 2. Delay Lines Left & Right
  // tapin~ 3000 ms buffer
  const tapinL = patcher.newobj('tapin~ 3000', {
    numinlets: 1,
    numoutlets: 1,
    outlettype: ['tapconnect'],
    patching_rect: [80, 150, 80, 22]
  });
  const tapinR = patcher.newobj('tapin~ 3000', {
    numinlets: 1,
    numoutlets: 1,
    outlettype: ['tapconnect'],
    patching_rect: [450, 150, 80, 22]
  });

  // tapout~ reads modulated delay time
  const tapoutL = patcher.newobj('tapout~ 350', {
    numinlets: 1,
    numoutlets: 1,
    outlettype: ['signal'],
    patching_rect: [80, 200, 75, 22]
  });
  const tapoutR = patcher.newobj('tapout~ 350', {
    numinlets: 1,
    numoutlets: 1,
    outlettype: ['signal'],
    patching_rect: [450, 200, 75, 22]
  });

  patcher.connect(tapinL, 0, tapoutL, 0);
  patcher.connect(tapinR, 0, tapoutR, 0);
  patcher.connect(modDelayTime, 0, tapoutL, 0);
  patcher.connect(modDelayTime, 0, tapoutR, 0);

  // 3. Feedback and Filter Section
  const fbScale = patcher.newobj('/ 100.', {
    patching_rect: [580, 100, 45, 22]
  });
  const fbSig = patcher.newobj('sig~ 0.45', {
    patching_rect: [580, 140, 55, 22]
  });
  patcher.connect(feedbackDial, 0, fbScale, 0);
  patcher.connect(fbScale, 0, fbSig, 0);

  const fbMulL = patcher.newobj('*~', {
    numinlets: 2,
    numoutlets: 1,
    outlettype: ['signal'],
    patching_rect: [110, 240, 32, 22]
  });
  const fbMulR = patcher.newobj('*~', {
    numinlets: 2,
    numoutlets: 1,
    outlettype: ['signal'],
    patching_rect: [480, 240, 32, 22]
  });

  patcher.connect(tapoutL, 0, fbMulL, 0);
  patcher.connect(fbSig, 0, fbMulL, 1);
  patcher.connect(tapoutR, 0, fbMulR, 0);
  patcher.connect(fbSig, 0, fbMulR, 1);

  // Resonant lowpass filter on feedback: lores~
  const filterL = patcher.newobj('lores~ 6000 0.2', {
    numinlets: 3,
    numoutlets: 1,
    outlettype: ['signal'],
    patching_rect: [110, 280, 95, 22]
  });
  const filterR = patcher.newobj('lores~ 6000 0.2', {
    numinlets: 3,
    numoutlets: 1,
    outlettype: ['signal'],
    patching_rect: [480, 280, 95, 22]
  });

  patcher.connect(cutoffDial, 0, filterL, 1);
  patcher.connect(cutoffDial, 0, filterR, 1);
  patcher.connect(fbMulL, 0, filterL, 0);
  patcher.connect(fbMulR, 0, filterR, 0);

  // Audio input + feedback into tapin~
  patcher.connect(patcher.plugin, 0, tapinL, 0);
  patcher.connect(filterL, 0, tapinL, 0);
  patcher.connect(patcher.plugin, 1, tapinR, 0);
  patcher.connect(filterR, 0, tapinR, 0);

  // 4. Dry/Wet Crossfade
  const dryWetScale = patcher.newobj('/ 100.', {
    patching_rect: [650, 100, 45, 22]
  });
  const wetSig = patcher.newobj('sig~ 0.5', {
    patching_rect: [650, 140, 50, 22]
  });
  const drySig = patcher.newobj('!-~ 1.', {
    numinlets: 2,
    numoutlets: 1,
    outlettype: ['signal'],
    patching_rect: [710, 140, 45, 22]
  });

  patcher.connect(dryWetDial, 0, dryWetScale, 0);
  patcher.connect(dryWetScale, 0, wetSig, 0);
  patcher.connect(wetSig, 0, drySig, 0);

  // Wet audio multipliers
  const wetMulL = patcher.newobj('*~', { numinlets: 2, numoutlets: 1, outlettype: ['signal'], patching_rect: [80, 330, 32, 22] });
  const wetMulR = patcher.newobj('*~', { numinlets: 2, numoutlets: 1, outlettype: ['signal'], patching_rect: [450, 330, 32, 22] });
  patcher.connect(tapoutL, 0, wetMulL, 0);
  patcher.connect(wetSig, 0, wetMulL, 1);
  patcher.connect(tapoutR, 0, wetMulR, 0);
  patcher.connect(wetSig, 0, wetMulR, 1);

  // Dry audio multipliers
  const dryMulL = patcher.newobj('*~', { numinlets: 2, numoutlets: 1, outlettype: ['signal'], patching_rect: [30, 330, 32, 22] });
  const dryMulR = patcher.newobj('*~', { numinlets: 2, numoutlets: 1, outlettype: ['signal'], patching_rect: [400, 330, 32, 22] });
  patcher.connect(patcher.plugin, 0, dryMulL, 0);
  patcher.connect(drySig, 0, dryMulL, 1);
  patcher.connect(patcher.plugin, 1, dryMulR, 0);
  patcher.connect(drySig, 0, dryMulR, 1);

  // Sum dry + wet
  const outSumL = patcher.newobj('+~', { numinlets: 2, numoutlets: 1, outlettype: ['signal'], patching_rect: [30, 370, 32, 22] });
  const outSumR = patcher.newobj('+~', { numinlets: 2, numoutlets: 1, outlettype: ['signal'], patching_rect: [400, 370, 32, 22] });

  patcher.connect(dryMulL, 0, outSumL, 0);
  patcher.connect(wetMulL, 0, outSumL, 1);
  patcher.connect(dryMulR, 0, outSumR, 0);
  patcher.connect(wetMulR, 0, outSumR, 1);

  // Output to plugout~
  patcher.connectToOutput(outSumL, 0, outSumR, 0);

  return patcher;
}
