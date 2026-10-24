import { Patcher } from '../core/patcher.js';
import { DEVICE_TYPES } from '../core/constants.js';

/**
 * Base template for Max for Live MIDI Effects.
 * Provides midiin (raw MIDI stream from Live track) and midiout (MIDI out to track).
 */
export class M4LMidiEffect extends Patcher {
  constructor(options = {}) {
    super({
      name: options.name || 'M4LMidiEffect',
      type: DEVICE_TYPES.MIDI_EFFECT,
      openInPresentation: true,
      ...options
    });

    // midiin receives raw MIDI from Live track
    this.midiin = this.newobj('midiin', {
      numinlets: 1,
      numoutlets: 1,
      outlettype: ['int'],
      patching_rect: [30, 30, 48, 22]
    });

    // midiparse decomposes MIDI into pitch, velocity, channel, cc, etc.
    this.midiparse = this.newobj('midiparse', {
      numinlets: 1,
      numoutlets: 7,
      outlettype: ['', '', '', '', '', '', ''],
      patching_rect: [30, 80, 100, 22]
    });
    this.connect(this.midiin, 0, this.midiparse, 0);

    // midiformat reconstructs MIDI stream
    this.midiformat = this.newobj('midiformat', {
      numinlets: 7,
      numoutlets: 1,
      outlettype: ['int'],
      patching_rect: [30, 340, 100, 22]
    });

    // midiout sends MIDI back to the Live track
    this.midiout = this.newobj('midiout', {
      numinlets: 1,
      numoutlets: 0,
      outlettype: [],
      patching_rect: [30, 400, 52, 22]
    });
    this.connect(this.midiformat, 0, this.midiout, 0);
  }
}
