# Audio Programming

Primary workspace for my audio-development projects.

This repo currently tracks:

- `Max4Live/` — code-first Max for Live devices and tooling
- `tools/` — automation scripts (README→blog sync + static publish)
- `blog/` — project/blog mapping and generated post metadata
- `vst-plugins/RandomDriftDelay/` — in-repo VST project

## Linked repos (tracked separately)

These projects live in their own GitHub repositories and are linked from here:

- VCV Rack modules collection: https://github.com/maxpatzelt/VCVRackModules
- DubWise VST: https://github.com/maxpatzelt/DubWise
- RTL-SDR VST3: https://github.com/maxpatzelt/rtl-sdr-vst3

## README → synth blog pipeline

Generate markdown posts from project READMEs:

```bash
python3 tools/readme_blog_sync.py --workspace-root . --manifest blog/PROJECTS.json
```

Generate static synth-blog HTML from those posts:

```bash
python3 tools/publish_synthblog.py --workspace-root . --site-dir blog/site
```

The live site is deployed to `https://maxpat.ch/synthblog/`.
