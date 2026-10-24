import { UI_UNITS } from './constants.js';

/**
 * Represents a Box (node / object) inside a Max patcher.
 */
export class Box {
  constructor(id, options = {}) {
    this.id = id;
    this.maxclass = options.maxclass || 'newobj';
    this.text = options.text || '';
    this.varname = options.varname || id;
    this.numinlets = options.numinlets ?? 1;
    this.numoutlets = options.numoutlets ?? 1;
    this.outlettype = options.outlettype || [''];
    this.patching_rect = options.patching_rect || [0, 0, 100, 22];
    this.presentation = options.presentation ? 1 : 0;
    this.presentation_rect = options.presentation_rect || null;
    this.parameter_enable = options.parameter_enable ? 1 : 0;
    this.saved_attribute_attributes = options.saved_attribute_attributes || null;
    this.extra = options.extra || {};
  }

  toJSON() {
    const boxObj = {
      id: this.id,
      maxclass: this.maxclass,
      numinlets: this.numinlets,
      numoutlets: this.numoutlets,
      outlettype: this.outlettype,
      patching_rect: this.patching_rect
    };

    if (this.text) {
      boxObj.text = this.text;
    }
    if (this.varname) {
      boxObj.varname = this.varname;
    }
    if (this.presentation) {
      boxObj.presentation = 1;
      if (this.presentation_rect) {
        boxObj.presentation_rect = this.presentation_rect;
      }
    }
    if (this.parameter_enable) {
      boxObj.parameter_enable = 1;
    }
    if (this.saved_attribute_attributes) {
      boxObj.saved_attribute_attributes = this.saved_attribute_attributes;
    }

    // Merge any specialized attributes
    for (const [k, v] of Object.entries(this.extra)) {
      boxObj[k] = v;
    }

    return { box: boxObj };
  }

  /**
   * Factory: Generic Max object (e.g. cycle~, lores~, scale, +~)
   */
  static newobj(id, text, options = {}) {
    return new Box(id, {
      maxclass: 'newobj',
      text,
      ...options
    });
  }

  /**
   * Factory: Message box (e.g. "bang", "$1 20", "set $1")
   */
  static message(id, text, options = {}) {
    return new Box(id, {
      maxclass: 'message',
      text,
      numinlets: 2,
      numoutlets: 1,
      outlettype: [''],
      patching_rect: [0, 0, 50, 22],
      ...options
    });
  }

  /**
   * Factory: Comment box (annotation / visual label)
   */
  static comment(id, text, options = {}) {
    return new Box(id, {
      maxclass: options.presentation ? 'live.comment' : 'comment',
      text,
      numinlets: 1,
      numoutlets: 0,
      outlettype: [],
      patching_rect: [0, 0, 150, 20],
      ...options
    });
  }

  /**
   * Factory: Ableton Live rotary dial (live.dial)
   */
  static liveDial(id, name, options = {}) {
    const min = options.min ?? 0;
    const max = options.max ?? 100;
    const initial = options.initial ?? min;
    const unitStyle = options.unitStyle ?? UI_UNITS.FLOAT;
    const isInt = options.type === 'int' || unitStyle === UI_UNITS.INT;

    return new Box(id, {
      maxclass: 'live.dial',
      varname: options.varname || name.toLowerCase().replace(/\s+/g, '_'),
      numinlets: 1,
      numoutlets: 2,
      outlettype: ['', 'float'],
      patching_rect: options.patching_rect || [0, 0, 44, 48],
      presentation: options.presentation ?? 1,
      presentation_rect: options.presentation_rect || [0, 0, 44, 48],
      parameter_enable: 1,
      saved_attribute_attributes: {
        valueof: {
          parameter_longname: name,
          parameter_shortname: options.shortname || name,
          parameter_type: isInt ? 1 : 0,
          parameter_mmin: min,
          parameter_mmax: max,
          parameter_initial: [initial],
          parameter_initial_enable: 1,
          parameter_unitstyle: unitStyle,
          parameter_steps: options.steps || 0
        }
      },
      ...options.extraBoxProps
    });
  }

  /**
   * Factory: Ableton Live toggle (live.toggle)
   */
  static liveToggle(id, name, options = {}) {
    return new Box(id, {
      maxclass: 'live.toggle',
      varname: options.varname || name.toLowerCase().replace(/\s+/g, '_'),
      numinlets: 1,
      numoutlets: 2,
      outlettype: ['', 'float'],
      patching_rect: options.patching_rect || [0, 0, 24, 24],
      presentation: options.presentation ?? 1,
      presentation_rect: options.presentation_rect || [0, 0, 24, 24],
      parameter_enable: 1,
      saved_attribute_attributes: {
        valueof: {
          parameter_longname: name,
          parameter_shortname: options.shortname || name,
          parameter_type: 2,
          parameter_mmin: 0.0,
          parameter_mmax: 1.0,
          parameter_initial: [options.initial ? 1.0 : 0.0],
          parameter_initial_enable: 1,
          parameter_enum: ['off', 'on']
        }
      }
    });
  }

  /**
   * Factory: Ableton Live number box (live.numbox)
   */
  static liveNumbox(id, name, options = {}) {
    const min = options.min ?? 0;
    const max = options.max ?? 127;
    const initial = options.initial ?? min;

    return new Box(id, {
      maxclass: 'live.numbox',
      varname: options.varname || name.toLowerCase().replace(/\s+/g, '_'),
      numinlets: 1,
      numoutlets: 2,
      outlettype: ['', 'float'],
      patching_rect: options.patching_rect || [0, 0, 50, 15],
      presentation: options.presentation ?? 1,
      presentation_rect: options.presentation_rect || [0, 0, 50, 15],
      parameter_enable: 1,
      saved_attribute_attributes: {
        valueof: {
          parameter_longname: name,
          parameter_shortname: options.shortname || name,
          parameter_type: options.type === 'float' ? 0 : 1,
          parameter_mmin: min,
          parameter_mmax: max,
          parameter_initial: [initial],
          parameter_initial_enable: 1,
          parameter_unitstyle: options.unitStyle ?? UI_UNITS.INT
        }
      }
    });
  }

  /**
   * Factory: Max V8 JavaScript object
   */
  static v8(id, scriptPath, options = {}) {
    const text = `v8 ${scriptPath}`;
    return new Box(id, {
      maxclass: 'newobj',
      text,
      numinlets: options.numinlets ?? 1,
      numoutlets: options.numoutlets ?? 1,
      outlettype: options.outlettype || [''],
      patching_rect: options.patching_rect || [0, 0, 140, 22],
      ...options
    });
  }
}
