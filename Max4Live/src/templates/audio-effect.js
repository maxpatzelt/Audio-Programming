import { Patcher } from '../core/patcher.js';
import { DEVICE_TYPES } from '../core/constants.js';

/**
 * Base template for Max for Live Audio Effects.
 * Provides plugin~ (audio input from Live track) and plugout~ (audio return to Live track).
 */
export class M4LAudioEffect extends Patcher {
  constructor(options = {}) {
    super({
      name: options.name || 'M4LAudioEffect',
      type: DEVICE_TYPES.AUDIO_EFFECT,
      openInPresentation: true,
      ...options
    });

    // plugin~ receives stereo audio from the Ableton track
    this.plugin = this.newobj('plugin~', {
      numinlets: 2,
      numoutlets: 2,
      outlettype: ['signal', 'signal'],
      patching_rect: [30, 30, 60, 22]
    });

    // plugout~ returns stereo audio back to the Ableton track
    this.plugout = this.newobj('plugout~', {
      numinlets: 2,
      numoutlets: 2,
      outlettype: ['signal', 'signal'],
      patching_rect: [30, 400, 60, 22]
    });
  }

  /**
   * Connect stereo signals directly to plugout~
   */
  connectToOutput(leftSignalBox, leftOutlet, rightSignalBox, rightOutlet) {
    this.connect(leftSignalBox, leftOutlet, this.plugout, 0);
    this.connect(rightSignalBox, rightOutlet, this.plugout, 1);
  }
}
