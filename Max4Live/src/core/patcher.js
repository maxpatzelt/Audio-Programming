import fs from 'node:fs';
import path from 'node:path';
import { Box } from './box.js';
import { Patchline } from './patchline.js';
import { DEFAULT_APP_VERSION, DEVICE_TYPES } from './constants.js';

/**
 * Fluent Patcher builder representing a Cycling '74 Max patcher document.
 */
export class Patcher {
  constructor(options = {}) {
    this.name = options.name || 'UntitledDevice';
    this.type = options.type || DEVICE_TYPES.AUDIO_EFFECT;
    this.openInPresentation = options.openInPresentation ?? true;
    this.appVersion = { ...DEFAULT_APP_VERSION, ...(options.appVersion || {}) };
    this.rect = options.rect || [100.0, 100.0, 700.0, 500.0];
    this.description = options.description || '';
    this.author = options.author || '';

    this.boxes = [];
    this.lines = [];
    this._boxIdCounter = 1;
    this._boxesById = new Map();
    this._boxesByVarname = new Map();

    // Auto-layout helpers
    this._patchingCursor = { x: 30, y: 30, lineHeight: 40 };
    this._presentationCursor = { x: 10, y: 15, padding: 10, rowHeight: 70 };
  }

  /**
   * Generates next sequential box ID (e.g. 'obj-1', 'obj-2')
   */
  nextId() {
    return `obj-${this._boxIdCounter++}`;
  }

  /**
   * Add a pre-instantiated Box to the patcher.
   */
  addBox(box) {
    if (this._boxesById.has(box.id)) {
      throw new Error(`Box with id '${box.id}' already exists in patcher`);
    }

    // Auto-assign patching coordinates if at default origin
    if (box.patching_rect[0] === 0 && box.patching_rect[1] === 0) {
      box.patching_rect[0] = this._patchingCursor.x;
      box.patching_rect[1] = this._patchingCursor.y;
      this._patchingCursor.y += this._patchingCursor.lineHeight;
      if (this._patchingCursor.y > 600) {
        this._patchingCursor.y = 30;
        this._patchingCursor.x += 180;
      }
    }

    // Auto-assign presentation coordinates if presentation enabled and at 0,0
    if (box.presentation && box.presentation_rect && box.presentation_rect[0] === 0 && box.presentation_rect[1] === 0) {
      box.presentation_rect[0] = this._presentationCursor.x;
      box.presentation_rect[1] = this._presentationCursor.y;
      const width = box.presentation_rect[2] || 44;
      this._presentationCursor.x += width + this._presentationCursor.padding;
    }

    this.boxes.push(box);
    this._boxesById.set(box.id, box);
    if (box.varname) {
      this._boxesByVarname.set(box.varname, box);
    }
    return box;
  }

  /**
   * Fluent helper: Create and add a newobj
   */
  newobj(text, options = {}) {
    const id = options.id || this.nextId();
    const box = Box.newobj(id, text, options);
    return this.addBox(box);
  }

  /**
   * Fluent helper: Create and add a message box
   */
  message(text, options = {}) {
    const id = options.id || this.nextId();
    const box = Box.message(id, text, options);
    return this.addBox(box);
  }

  /**
   * Fluent helper: Create and add a comment / label
   */
  comment(text, options = {}) {
    const id = options.id || this.nextId();
    const box = Box.comment(id, text, options);
    return this.addBox(box);
  }

  /**
   * Fluent helper: Create and add a live.dial
   */
  liveDial(name, options = {}) {
    const id = options.id || this.nextId();
    const box = Box.liveDial(id, name, options);
    return this.addBox(box);
  }

  /**
   * Fluent helper: Create and add a live.toggle
   */
  liveToggle(name, options = {}) {
    const id = options.id || this.nextId();
    const box = Box.liveToggle(id, name, options);
    return this.addBox(box);
  }

  /**
   * Fluent helper: Create and add a live.numbox
   */
  liveNumbox(name, options = {}) {
    const id = options.id || this.nextId();
    const box = Box.liveNumbox(id, name, options);
    return this.addBox(box);
  }

  /**
   * Fluent helper: Create and add a Max V8 object
   */
  v8(scriptPath, options = {}) {
    const id = options.id || this.nextId();
    const box = Box.v8(id, scriptPath, options);
    return this.addBox(box);
  }

  /**
   * Find a box by ID or scripting name (varname)
   */
  findBox(ref) {
    if (ref instanceof Box) return ref;
    if (typeof ref === 'string') {
      if (this._boxesById.has(ref)) return this._boxesById.get(ref);
      if (this._boxesByVarname.has(ref)) return this._boxesByVarname.get(ref);
    }
    return null;
  }

  /**
   * Connect an outlet of source box to inlet of destination box.
   * @param {Box|string} src - Source box or ID/varname
   * @param {number} srcOutlet - 0-based outlet index
   * @param {Box|string} dst - Destination box or ID/varname
   * @param {number} dstInlet - 0-based inlet index
   * @param {object} [options]
   */
  connect(src, srcOutlet, dst, dstInlet, options = {}) {
    const srcBox = this.findBox(src);
    const dstBox = this.findBox(dst);

    if (!srcBox) {
      throw new Error(`Connection source not found: ${src}`);
    }
    if (!dstBox) {
      throw new Error(`Connection destination not found: ${dst}`);
    }
    if (srcOutlet >= srcBox.numoutlets) {
      throw new Error(
        `Source outlet index out of range: ${srcBox.id} (${srcBox.text || srcBox.maxclass}) has ${srcBox.numoutlets} outlets, requested ${srcOutlet}`
      );
    }
    if (dstInlet >= dstBox.numinlets) {
      throw new Error(
        `Destination inlet index out of range: ${dstBox.id} (${dstBox.text || dstBox.maxclass}) has ${dstBox.numinlets} inlets, requested ${dstInlet}`
      );
    }

    const line = new Patchline(srcBox.id, srcOutlet, dstBox.id, dstInlet, options);
    this.lines.push(line);
    return this;
  }

  /**
   * Validate entire patcher integrity:
   * 1. No orphaned or duplicate IDs
   * 2. All patchlines point to existing boxes and valid port ranges
   * 3. Max for Live specific constraints
   */
  validate() {
    const errors = [];
    const idSet = new Set();

    for (const b of this.boxes) {
      if (idSet.has(b.id)) {
        errors.push(`Duplicate box id: ${b.id}`);
      }
      idSet.add(b.id);

      if (b.presentation && (!b.presentation_rect || b.presentation_rect.length !== 4)) {
        errors.push(`Box ${b.id} has presentation enabled but invalid presentation_rect`);
      }
    }

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const src = this._boxesById.get(line.sourceId);
      const dst = this._boxesById.get(line.destinationId);

      if (!src) {
        errors.push(`Line #${i}: unknown source ${line.sourceId}`);
      } else if (line.sourceOutlet >= src.numoutlets) {
        errors.push(`Line #${i}: outlet ${line.sourceOutlet} exceeds source ${src.id} outlet count (${src.numoutlets})`);
      }

      if (!dst) {
        errors.push(`Line #${i}: unknown destination ${line.destinationId}`);
      } else if (line.destinationInlet >= dst.numinlets) {
        errors.push(`Line #${i}: inlet ${line.destinationInlet} exceeds destination ${dst.id} inlet count (${dst.numinlets})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Export to standard Cycling '74 Max JSON patcher object
   */
  toJSON() {
    const validation = this.validate();
    if (!validation.valid) {
      throw new Error(`Patcher validation failed:\n  - ${validation.errors.join('\n  - ')}`);
    }

    return {
      patcher: {
        fileversion: 1,
        appversion: this.appVersion,
        classnamespace: 'box',
        rect: this.rect,
        bglocked: 0,
        openinpresentation: this.openInPresentation ? 1 : 0,
        default_fontsize: 12.0,
        default_fontface: 0,
        default_fontname: 'Arial',
        gridonopen: 1,
        gridsize: [15.0, 15.0],
        gridsnaponopen: 1,
        objectsnaponopen: 1,
        statusbarvisible: 2,
        toolbarvisible: 1,
        lefttoolbarpinned: 0,
        toptoolbarpinned: 0,
        righttoolbarpinned: 0,
        bottomtoolbarpinned: 0,
        toolbars_unpinned_last_save: 0,
        tallnewformat: 0,
        boxanimatetime: 200,
        enablehscroll: 1,
        enablevscroll: 1,
        devicewidth: 0.0,
        description: this.description,
        digest: '',
        tags: '',
        style: '',
        subpatcher_template: '',
        assistshowspatchername: 0,
        boxes: this.boxes.map(b => b.toJSON()),
        lines: this.lines.map(l => l.toJSON())
      }
    };
  }

  /**
   * Serialize patcher to JSON string
   */
  toString(pretty = true) {
    return JSON.stringify(this.toJSON(), null, pretty ? 2 : 0);
  }

  /**
   * Save patcher directly as a .maxpat file
   */
  saveMaxpat(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, this.toString(true), 'utf8');
    return filePath;
  }
}
