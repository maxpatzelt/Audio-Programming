# BinaryLFO Handoff

Updated: 2026-10-12

## Current State

- **IMPLEMENTED:** `BinaryLFO` is a code-generated Max for Live Audio Effect.
- **USER-REPORTED LIVE TEST:** The user loaded it in Ableton Live and reported that it works "pretty good." The exact controls, targets, and duration exercised were not recorded.
- **AUTOMATED CHECKS:** `npm test` passes 15 tests, including deterministic Amount tests, device-graph validation, and AMXD packaging.
- **BUILT:** `dist/BinaryLFO.amxd`, `dist/BinaryLFO.maxpat`, and `dist/binary_lfo.js`.
- **INSTALLED:** `C:\Users\Max\Documents\Ableton\User Library\Presets\Audio Effects\Max Audio Effect\BinaryLFO.amxd` and adjacent `binary_lfo.js`. Installed files were SHA-256 checked against `dist` after copying.

## Behavior

- A clock tick first generates a 50/50 random binary value.
- Amount controls how many base-high values survive. The high-output probability is $0.5 \times (\text{Amount}/100)$.
- Amount 0% therefore always outputs 0; Amount 100% preserves the normal 50/50 pattern.
- The Amount control changes high-event density, not clock rate or the probability of the base random generator.
- Each 0/1 output is broadcast to the mapped Live parameters. Normalized `live.remote~` values map 0 and 1 to each target's minimum and maximum.
- There are eight mapping slots. Map begins Live parameter selection; Unmap clears the selected remote. Show/Hide Multimap controls slots 2-8.
- Rate supports Hz and tempo-synced note divisions. The ×10 toggle applies in Hz mode only.
- The device is an Audio Effect and passes stereo audio through unchanged.

## Source and Commands

- Device graph: `src/devices/binary-lfo.js`
- V8 runtime: `runtime/v8/binary_lfo.js`
- Build registration and deployment: `src/cli/index.js`
- Runtime tests: `test/binary-lfo-runtime.test.js`
- Patcher tests: `test/devices.test.js`

From the project directory:

```powershell
npm test
npm run build
```

`npm run deploy` deploys all registered devices. It copies only each device's declared runtime scripts into the matching Audio or MIDI Effects preset folder.

## Next Session Checks

The user's positive smoke-test report is recorded, but it did not identify which controls or mapped targets were exercised. When resuming, verify these explicitly:

- Map and unmap one Live parameter and confirm its values switch between exact minimum and maximum.
- Test Amount at 0%, 50%, and 100%; confirm it changes dropout density without affecting the selected rate.
- Check both Hz (including ×10) and tempo-sync divisions while Live transport runs.
- Expand Multimap, map multiple targets, and confirm each follows the same binary stream.
- Save and reopen the Live Set to check whether mappings persist.

Keep any fixes confined to the BinaryLFO device unless a check identifies a shared builder or deployment issue.
