# MicroKorg CC Mapper

Created: 2026-10-13
Status: Built, installed, and graph-tested; not yet verified in Live.

## Purpose

`MicroKorgCCMapper` is a Max for Live MIDI Effect for mapping the KORG microKORG's outgoing MIDI CC controls to Ableton Live parameters. It replaces the older User Library mapper under a distinct filename.

## Mapping Behavior

- The UI contains one named row for every parameter entry in the MIDI Guide table: 47 Map/Unmap rows.
- The table contains 40 unique CC numbers. Seven numbers appear twice: CC 10, 18, 19, 21, 74, 79, and 83.
- Each distinct CC is routed and normalized once. Its value is shared by all rows with that CC number, while each row has its own `live.map` and `live.remote~` target.
- Press **Map**, then click an Ableton Live parameter. Incoming values 0-127 are scaled to 0-1; normalized remote control maps the endpoints to that target parameter's minimum and maximum.
- Use the parameter-group menu to show one group of rows at a time.
- The device routes MIDI through Live's MIDI-effect chain so notes can continue to the downstream instrument. It does not select or send to a physical MIDI output port.
- Centered entries retain a `(centered)` label for reference; the CC value still maps linearly from the target minimum to maximum.

## Guide Data and License

The parameter labels, CC numbers, ranges, and usage descriptions were transcribed from the [KORG microKORG MIDI Guide](https://midi.guide/d/korg/microkorg/). The guide reports 47 parameters and lists the dataset under **CC BY-SA 4.0**. Attribution is retained in `src/devices/microkorg-ccs.js`; redistributions of this adapted dataset must follow that license.

## Project Files

- `src/devices/microkorg-ccs.js`: attributed source table, including duplicate aliases and usage ranges.
- `src/devices/microkorg-cc-mapper.js`: generated MIDI-effect graph and mapping UI.
- `test/microkorg-ccs.test.js`: count, range, alias routing, and AMXD packaging checks.
- `dist/MicroKorgCCMapper.amxd`: built device.
- `dist/MicroKorgCCMapper.maxpat`: editable JSON patcher.
- `C:\Users\Max\Documents\Ableton\User Library\Presets\MIDI Effects\Max MIDI Effect\MicroKorgCCMapper.amxd`: installed Live device.

Build from the project directory with:

```powershell
npm test
npm run build
```

The general `npm run deploy` command deploys all registered devices. This device was installed individually so other devices were not recopied. Its SHA-256 was verified against the build before cleanup.

The previous `microkorg midi cc map.amxd` and its paired `microkorg midi cc map.adv` were removed after the preset was confirmed to reference the old AMXD. No other files in the MIDI Effects folder were removed.

## Live Verification Needed

- Load the newly built device on a MIDI track with the MicroKorg routed into it and an instrument after it.
- Confirm incoming CCs drive the selected Live parameter and notes still reach the downstream instrument.
- Test a shared CC such as 18: map both OSC 2 Semitone and Vocoder HPF level to separate Live parameters and confirm both follow the same incoming value.
- Verify Map/Unmap and the parameter-group selector in Live.
- Confirm centered CC labels correspond to useful target behavior; no special centering curve is applied by this device.
