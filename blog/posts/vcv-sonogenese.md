---
title: "Sonogenese (VCV Rack)"
slug: "vcv-sonogenese"
project_type: "vcv"
github_url: "https://github.com/maxpatzelt/VCVRackModules/tree/main/Sonogenese"
repo_path: "vcv-rack-modules/Sonogenese"
source_readme: "vcv-rack-modules/Sonogenese/README.md"
generated_at_utc: "2026-10-24T19:07:18Z"
---

# Sonogenese (VCV Rack)

> Synced from project README.
> Repo: https://github.com/maxpatzelt/VCVRackModules/tree/main/Sonogenese

## Overview
SONOGENESE is an experimental 4HP VCO for VCV Rack featuring advanced granular synthesis, spectral manipulation, and morphing topologies inspired by French experimental music aesthetics.

## Features

### Fragmentation (Frag)
Granular synthesis with jittered grain lengths and crossfading. Creates evolving textures from the base wavetable.

### Topologie
Morphs between different waveshaping algorithms:
- Sine wave (clean)
- Chebyshev polynomial orders 2-9 (harmonic generation)
- Folded waveforms (extreme overtones)
- Impulse trains (percussive)

### Écart (Temporal Skew)
Nonlinear phase modulation using delay line scrubbing. Creates time-warped oscillations and phase drift effects.

### Floraison (Spectral Bloom)
Additive synthesis with up to 16 harmonics:
- Spread control (up to 9x fundamental)
- Amplitude shaping per harmonic
- Subtle detuning for organic character
- Progressive harmonic filtering

## Technical Details
- Gold color scheme (#e8b339)
- 4HP width with 2x2 knob grid
- CV inputs with attenuverters
- 2048-sample wavetable engine
- 4096-sample delay line
- V/Oct input for pitch tracking

## Building
```bash
make devinstall
```

## Usage
Use V/Oct input for pitched operation. Combine parameters for complex timbres - try high Floraison with moderate Topologie for rich harmonic textures, or Fragmentation with Écart for glitchy granular effects.

## License
MIT License
