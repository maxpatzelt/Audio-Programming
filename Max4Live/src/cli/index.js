#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AMXDContainer } from '../core/amxd.js';
import { LIVE_PATHS } from '../core/constants.js';
import { buildVibeDelay } from '../devices/vibe-delay.js';
import { buildVibeEuclid } from '../devices/vibe-euclid.js';
import { buildBinaryLfo } from '../devices/binary-lfo.js';
import { buildMicroKorgCCMapper } from '../devices/microkorg-cc-mapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DIST_DIR = path.resolve(PROJECT_ROOT, 'dist');
const RUNTIME_DIR = path.resolve(PROJECT_ROOT, 'runtime');

/**
 * Build all registered devices to dist/
 */
export function buildAll() {
  console.log('=== Max for Live Vibe Coder: Building Devices ===\n');

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  const devices = [
    { name: 'VibeDelay', builder: buildVibeDelay, ext: 'amxd' },
    { name: 'VibeEuclid', builder: buildVibeEuclid, ext: 'amxd', runtimeFiles: ['v8/euclid_core.js'] },
    { name: 'BinaryLFO', builder: buildBinaryLfo, ext: 'amxd', runtimeFiles: ['v8/binary_lfo.js'] },
    { name: 'MicroKorgCCMapper', builder: buildMicroKorgCCMapper, ext: 'amxd' }
  ];

  const results = [];

  for (const dev of devices) {
    console.log(`Building [${dev.name}]...`);
    const patcher = dev.builder();
    const validation = patcher.validate();

    if (!validation.valid) {
      console.error(`Validation failed for ${dev.name}:`);
      for (const err of validation.errors) {
        console.error(`  - ${err}`);
      }
      process.exitCode = 1;
      continue;
    }

    const amxdPath = path.join(DIST_DIR, `${dev.name}.amxd`);
    const maxpatPath = path.join(DIST_DIR, `${dev.name}.maxpat`);

    // Save binary AMXD
    AMXDContainer.saveAmxd(amxdPath, patcher);
    // Save human-readable .maxpat JSON
    patcher.saveMaxpat(maxpatPath);

    // Copy associated runtime files if any
    if (dev.runtimeFiles) {
      for (const rf of dev.runtimeFiles) {
        const srcFile = path.join(RUNTIME_DIR, rf);
        const dstFile = path.join(DIST_DIR, path.basename(rf));
        if (fs.existsSync(srcFile)) {
          fs.copyFileSync(srcFile, dstFile);
          console.log(`  -> Bundled runtime: ${path.basename(rf)}`);
        }
      }
    }

    const amxdStat = fs.statSync(amxdPath);
    console.log(`  -> Generated ${path.relative(PROJECT_ROOT, amxdPath)} (${amxdStat.size} bytes)`);
    console.log(`  -> Generated ${path.relative(PROJECT_ROOT, maxpatPath)}`);
    console.log(`  -> Boxes: ${patcher.boxes.length}, Connections: ${patcher.lines.length}\n`);

    results.push({ name: dev.name, amxdPath, patcher, runtimeFiles: dev.runtimeFiles || [] });
  }

  console.log('Build complete!\n');
  return results;
}

/**
 * Deploy built devices directly to Ableton Live User Library
 */
export function deployToLive() {
  const buildResults = buildAll();
  console.log('=== Deploying to Ableton Live User Library ===\n');

  for (const item of buildResults) {
    const isAudio = item.patcher.type === 'aaaa';
    const targetDir = isAudio ? LIVE_PATHS.AUDIO_PRESETS : LIVE_PATHS.MIDI_PRESETS;

    if (!fs.existsSync(targetDir)) {
      try {
        fs.mkdirSync(targetDir, { recursive: true });
      } catch (err) {
        console.warn(`  Warning: Could not create Live preset directory: ${targetDir} (${err.message})`);
        continue;
      }
    }

    const destFile = path.join(targetDir, path.basename(item.amxdPath));
    fs.copyFileSync(item.amxdPath, destFile);
    console.log(`Deployed [${item.name}] -> ${destFile}`);

    for (const runtimeFile of item.runtimeFiles) {
      const runtimeName = path.basename(runtimeFile);
      const srcJs = path.join(DIST_DIR, runtimeName);
      const dstJs = path.join(targetDir, runtimeName);
      fs.copyFileSync(srcJs, dstJs);
      console.log(`  + Bundled JS -> ${dstJs}`);
    }
  }

  console.log('\nDeployment finished! Open Ableton Live 12 and find the devices in your User Library.');
}

/**
 * Inspect an existing .amxd or .maxpat file
 */
export function inspectFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exitCode = 1;
    return;
  }

  console.log(`\n=== Inspecting: ${filePath} ===`);
  const buf = fs.readFileSync(filePath);

  if (buf.subarray(0, 4).toString('ascii') === 'ampf') {
    const info = AMXDContainer.unpack(buf);
    console.log(`Format: Binary AMXD Container`);
    console.log(`Device Type: ${info.deviceType} (${
      info.deviceType === 'aaaa' ? 'Audio Effect' :
      info.deviceType === 'mmmm' ? 'MIDI Effect' :
      info.deviceType === 'iiii' ? 'Instrument' : 'Custom'
    })`);
    console.log(`Patcher App Version: ${JSON.stringify(info.json.patcher.appversion || {})}`);
    console.log(`Open in Presentation: ${info.json.patcher.openinpresentation}`);
    console.log(`Total Boxes: ${info.json.patcher.boxes?.length || 0}`);
    console.log(`Total Lines: ${info.json.patcher.lines?.length || 0}`);

    const uiBoxes = (info.json.patcher.boxes || [])
      .filter(b => b.box.presentation || b.box.parameter_enable)
      .map(b => `${b.box.maxclass} ("${b.box.saved_attribute_attributes?.valueof?.parameter_longname || b.box.varname || b.box.text || ''}")`);
    console.log(`Exposed Parameters (${uiBoxes.length}):`, uiBoxes);
  } else {
    // Pure JSON
    try {
      const json = JSON.parse(buf.toString('utf8'));
      console.log(`Format: JSON Max Patcher (.maxpat)`);
      console.log(`Total Boxes: ${json.patcher?.boxes?.length || 0}`);
      console.log(`Total Lines: ${json.patcher?.lines?.length || 0}`);
    } catch (err) {
      console.error(`Could not parse as AMXD or JSON: ${err.message}`);
    }
  }
}

/**
 * Watch mode for rapid vibe coding
 */
export function watchMode() {
  console.log('=== Watching for changes in src/ and runtime/... ===');
  buildAll();

  const watchDirs = [
    path.join(PROJECT_ROOT, 'src'),
    path.join(PROJECT_ROOT, 'runtime')
  ];

  let timeout = null;
  for (const dir of watchDirs) {
    if (fs.existsSync(dir)) {
      fs.watch(dir, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          console.log(`\n[${new Date().toLocaleTimeString()}] File changed: ${filename}. Rebuilding...`);
          buildAll();
        }, 150);
      });
    }
  }
}

// CLI Dispatcher
const command = process.argv[2] || 'build';

switch (command) {
  case 'build':
    buildAll();
    break;
  case 'deploy':
    deployToLive();
    break;
  case 'inspect':
    inspectFile(process.argv[3] || path.join(DIST_DIR, 'VibeDelay.amxd'));
    break;
  case 'watch':
    watchMode();
    break;
  default:
    console.log(`Unknown command: ${command}`);
    console.log('Usage: node src/cli/index.js [build|deploy|inspect|watch]');
    process.exitCode = 1;
}
