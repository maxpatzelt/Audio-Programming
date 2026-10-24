# Max for Live Vibe Coding Environment: Project Context

Documentation Date: 2026-10-13
Status: Initial prototypes built; BinaryLFO user-tested; MicroKorgCCMapper build-verified (2026-10-13)

---

## 1. Verified Environment Details

All items below were directly observed and verified on the local host on 2026-10-12:

- **Host Operating System:** Windows 10 / Windows 11 x64 (PowerShell 5.1).
- **Node.js Runtime:** `v24.19.0` (VERIFIED: supports native ES modules, `node:test`, modern V8 features).
- **npm Package Manager:** `12.2.0` (VERIFIED).
- **Git Version:** `2.33.1.windows.1` (VERIFIED).
- **Python Version:** `3.10.6` (VERIFIED).
- **Ableton Live Installation:**
  - **Executable:** `C:\ProgramData\Ableton\Live 12 Suite\Program\Ableton Live 12 Suite.exe` (VERIFIED).
  - **Product Version:** `12.4.6` (Live 12 Suite).
  - Also observed historical traces: `Live 11 Suite` in ProgramData, AppData configs for Live 11 and Live 12 releases.
- **Cycling '74 Max Installation:**
  - **Bundled Executable:** `C:\ProgramData\Ableton\Live 12 Suite\Resources\Max\Max.exe` (VERIFIED).
  - **Product Version:** `9.1.5.3db35fa476d` (Max 9.1.5 x64 with modern UI and V8 JavaScript engine).
- **User Document Directories:**
  - `C:\Users\Max\Documents\Ableton` (User Library at `C:\Users\Max\Documents\Ableton\User Library`)
  - `C:\Users\Max\Documents\Max 9` (Packages, Library, Snippets, Prototypes)
  - `C:\Users\Max\Documents\Max 8` (Historical packages and settings)
  - `C:\Users\Max\Documents\Max4Live Devices` (Contains existing AMXD devices including `LFO.amxd`)
- **Ableton Factory LFO Reference:**
  - `C:\ProgramData\Ableton\Live 12 Suite\Resources\Builtin\Devices\Audio Effects\LFO\Ableton Folder Info\LFO.amxd` (VERIFIED: Live 12 factory device; container uses a `ciph` payload, not plain patcher JSON).
  - `C:\Users\Max\Documents\Ableton\Factory Packs\Max for Live Essentials\Max Audio Effect\Control Devices\LFO.amxd` (VERIFIED: Max for Live Essentials copy).
  - The separate `C:\Users\Max\Documents\Max4Live Devices\LFO.amxd` is a different user device, not the factory LFO.
- **AMXD File Format Analysis:**
  - Header: 32-byte binary RIFF-like container:
    - Bytes 0..3: `ampf` (FourCC magic)
    - Bytes 4..7: `uint32_le` = 4 (length of type chunk)
    - Bytes 8..11: FourCC device type (`aaaa` = Audio Effect, `mmmm` = MIDI Effect, `iiii` = Instrument)
    - Bytes 12..15: `meta`
    - Bytes 16..19: `uint32_le` = 4
    - Bytes 20..23: `uint32_le` = 1 (meta version)
    - Bytes 24..27: `ptch`
    - Bytes 28..31: `uint32_le` = length of JSON patcher payload
    - Bytes 32+: UTF-8 encoded JSON Max patcher (`.maxpat` data), optionally null-terminated.
  - Verified against user's actual `LFO.amxd` and `CC_map8.amxd`.
  - Max and Ableton Live can directly open uncompressed JSON `.maxpat` patchers and `.amxd` binary containers.

---

## 2. Inferred Details and Assumptions

- **INFERRED:** Ableton Live 12.4.6 uses its bundled Max 9.1.5 instance by default unless an external standalone Max path has been explicitly overridden in Live Preferences.
- **INFERRED:** Development workflow can deploy compiled `.amxd` files directly into `C:\Users\Max\Documents\Ableton\User Library\Presets\...` for immediate visibility in Live's browser, or load them from any workspace directory.
- **VERIFIED from Cycling '74 reference documentation, 2026-10-12:** modern ES6+ Max JavaScript is instantiated with the `v8` object; `js` is documented as the legacy ECMAScript 5 engine.
- **VERIFIED from Cycling '74 references, 2026-10-12:** `live.map` selects Live UI parameters and outputs their paths/IDs; `live.remote~ @normalized 1` accepts normalized 0..1 values and scales them to the target parameter range.
- **VERIFIED:** Ableton's factory LFO device exists under Live 12's built-in Audio Effects and the Max for Live Essentials Factory Pack. Ableton's manual describes nine waveforms including Random and Bin, up to eight maps, Remote Control, Hz/beat-synced rate, and Hz-only x10. The bundled `.amxd` is not a plain patcher JSON reference.

---

## 3. Architectural Decisions

1. **Dual-Tier Architecture:**
   - **Tier 1: Offline Node.js Compiler & Toolkit (VS Code / CLI):**
     - Code-first programmatic Patcher AST (boxes, lines, parameters, presentation layout).
     - Automated serializer producing compliant `.maxpat` and `.amxd` files.
     - CLI commands: `build`, `watch`, `test`, `export-to-live`.
     - Zero mandatory external runtime dependencies for basic compilation; native `node:test` test suite.
   - **Tier 2: Max Runtime JavaScript & LiveAPI Bridges:**
    - Runtime scripts targeting Max 9's V8 engine (`v8` object).
     - Dynamic patcher mutation (`this.patcher.newdefault`, `this.patcher.connect`).
     - Live Object Model (`LiveAPI`) helpers for Ableton Live control, tempo/transport tracking, and clip manipulation.
2. **Device Presets & Types:**
   - Support all three Max for Live device classes:
     - `AudioEffect` (`aaaa`): `plugin~` audio in -> DSP -> `plugout~` audio out.
     - `MidiEffect` (`mmmm`): `midiin` / `midiparse` -> MIDI transform -> `midiformat` / `midiout`.
     - `Instrument` (`iiii`): `midiin` -> synthesizer DSP -> `plugout~`.
3. **Ableton Live UI Integration:**
   - Native support for Max for Live UI objects (`live.dial`, `live.slider`, `live.toggle`, `live.numbox`, `live.menu`, `live.gain~`, `live.meter~`).
   - Automated presentation layout coordinates so devices fit seamlessly onto Ableton Live 12's device rack strip.
   - Explicit parameter properties (`_parameter_range`, `_parameter_unitstyle`, `_parameter_shortname`, `_parameter_longname`).
4. **BinaryLFO prototype:**
  - **VERIFIED (user report, 2026-10-12):** User loaded the deployed device in Live and said it works "pretty good". Exact control-by-control checks were not recorded.
  - Audio-effect shell, random 0/1 V8 runtime, Hz and tempo-relative clock modes, Hz-only x10, Amount dropout control, and eight `live.map` / normalized `live.remote~` slots.
  - Amount 0% forces all outputs low; 100% preserves the base binary output; intermediate values retain each base-high event with probability `Amount / 100`.
  - No modulation mode, Offset, Shape, Steps, Jitter, or Smooth controls.
5. **MicroKorgCCMapper prototype:**
   - **BUILD-VERIFIED (2026-10-13):** Code-generated MIDI Effect with 47 labeled CC entries, 40 distinct CC routes, independent mapping slots for alias rows, and a section selector.
   - MIDI Guide CC dataset is adapted under CC BY-SA 4.0; attribution is preserved in the source manifest and device handoff docs.
   - **VERIFIED:** The prior 252-box User Library mapper and its paired `.adv` preset were removed after the new device was installed and hash-verified; the preset explicitly referenced the old AMXD.

---

## 5. Outstanding Questions & Future Verification

- **UNKNOWN / NOT YET TESTED:** Does the user prefer running Max in standalone edit mode during development, or developing with live reload directly inside an active Ableton Live 12 session?
- **NOT YET VERIFIED:** Detailed BinaryLFO checks: map/unmap each slot, fill all eight slots, confirm each target reaches exact min/max, verify sync/x10 behavior and Amount dropout distribution, and check mapping persistence after saving/reopening a Live Set.
- **NOT YET VERIFIED IN LIVE:** Load `dist/MicroKorgCCMapper.amxd`, confirm MIDI passes to the downstream instrument, Map/Unmap works on CC input, and each aliased row independently maps while receiving the same CC value.
- **VERIFIED:** Installed `MicroKorgCCMapper.amxd` at `C:\Users\Max\Documents\Ableton\User Library\Presets\MIDI Effects\Max MIDI Effect\MicroKorgCCMapper.amxd`; SHA-256 matched the project build before the previous mapper and paired preset were removed.
- **UNKNOWN:** Are any custom Max packages (e.g. CNMAT, Bach, FluCoMa) required for planned devices, or should we strictly stick to vanilla Max 9 + Live objects for maximum portability?
- **PLANNED:** Create automated watch mode that recompiles `.amxd` on file save and triggers live reload in Ableton.
