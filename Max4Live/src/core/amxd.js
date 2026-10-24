import fs from 'node:fs';
import path from 'node:path';
import { AMXD_HEADER, DEVICE_TYPES } from './constants.js';
import { Patcher } from './patcher.js';

/**
 * Handles binary packaging and parsing for Ableton Live Max for Live (.amxd) files.
 */
export class AMXDContainer {
  /**
   * Pack a Patcher instance or raw Max JSON object into an AMXD binary buffer.
   * @param {Patcher|object} patcher
   * @param {string} [deviceType] - FourCC: 'aaaa' (audio), 'mmmm' (midi), 'iiii' (instrument)
   * @returns {Buffer}
   */
  static pack(patcher, deviceType = null) {
    let jsonStr;
    let resolvedType = deviceType;

    if (patcher instanceof Patcher) {
      jsonStr = patcher.toString(true);
      resolvedType = resolvedType || patcher.type || DEVICE_TYPES.AUDIO_EFFECT;
    } else if (typeof patcher === 'object') {
      jsonStr = JSON.stringify(patcher, null, 2);
      resolvedType = resolvedType || DEVICE_TYPES.AUDIO_EFFECT;
    } else if (typeof patcher === 'string') {
      jsonStr = patcher;
      resolvedType = resolvedType || DEVICE_TYPES.AUDIO_EFFECT;
    } else {
      throw new TypeError('Expected Patcher instance, object, or string JSON');
    }

    // Ensure 4-byte string for device type
    if (!resolvedType || resolvedType.length !== 4) {
      throw new Error(`Invalid AMXD device type '${resolvedType}'. Must be 4 characters (e.g. 'aaaa', 'mmmm', 'iiii')`);
    }

    // Include trailing null byte as standard for Max AMXD containers
    const jsonBytes = Buffer.from(jsonStr + '\0', 'utf8');
    const header = Buffer.alloc(AMXD_HEADER.HEADER_SIZE);

    // 0..3: 'ampf'
    header.write(AMXD_HEADER.MAGIC, 0, 4, 'ascii');
    // 4..7: uint32LE = 4
    header.writeUInt32LE(AMXD_HEADER.CHUNK_LEN, 4);
    // 8..11: device type ('aaaa', 'mmmm', 'iiii')
    header.write(resolvedType, 8, 4, 'ascii');
    // 12..15: 'meta'
    header.write(AMXD_HEADER.META, 12, 4, 'ascii');
    // 16..19: uint32LE = 4
    header.writeUInt32LE(AMXD_HEADER.CHUNK_LEN, 16);
    // 20..23: uint32LE = 1 (meta version)
    header.writeUInt32LE(1, 20);
    // 24..27: 'ptch'
    header.write(AMXD_HEADER.PTCH, 24, 4, 'ascii');
    // 28..31: uint32LE = json payload length
    header.writeUInt32LE(jsonBytes.length, 28);

    return Buffer.concat([header, jsonBytes]);
  }

  /**
   * Unpack an AMXD binary buffer into its metadata and JSON patcher object.
   * @param {Buffer} buffer
   * @returns {{ deviceType: string, json: object, rawPatcherString: string }}
   */
  static unpack(buffer) {
    if (!Buffer.isBuffer(buffer)) {
      throw new TypeError('Expected a Buffer instance');
    }
    if (buffer.length < AMXD_HEADER.HEADER_SIZE) {
      throw new Error(`Buffer too short for AMXD header (${buffer.length} bytes < 32)`);
    }

    const magic = buffer.subarray(0, 4).toString('ascii');
    if (magic !== AMXD_HEADER.MAGIC) {
      throw new Error(`Invalid AMXD magic: '${magic}', expected '${AMXD_HEADER.MAGIC}'`);
    }

    const deviceType = buffer.subarray(8, 12).toString('ascii');
    const metaTag = buffer.subarray(12, 16).toString('ascii');
    const ptchTag = buffer.subarray(24, 28).toString('ascii');

    if (metaTag !== AMXD_HEADER.META || ptchTag !== AMXD_HEADER.PTCH) {
      throw new Error(`Malformed AMXD header chunks: meta='${metaTag}', ptch='${ptchTag}'`);
    }

    const ptchLen = buffer.readUInt32LE(28);
    const rawData = buffer.subarray(32, 32 + ptchLen);
    const rawPatcherString = rawData.toString('utf8').replace(/\0+$/, '').trim();

    let json;
    try {
      json = JSON.parse(rawPatcherString);
    } catch (err) {
      throw new Error(`Failed to parse AMXD JSON patcher payload: ${err.message}`);
    }

    return {
      deviceType,
      json,
      rawPatcherString
    };
  }

  /**
   * Save a Patcher or JSON as an .amxd file on disk.
   */
  static saveAmxd(filePath, patcher, deviceType = null) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const buf = AMXDContainer.pack(patcher, deviceType);
    fs.writeFileSync(filePath, buf);
    return filePath;
  }

  /**
   * Read and parse an .amxd file from disk.
   */
  static loadAmxd(filePath) {
    const buf = fs.readFileSync(filePath);
    return AMXDContainer.unpack(buf);
  }
}
