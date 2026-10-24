/**
 * Constants for Cycling '74 Max 9 and Ableton Live 12 Max for Live devices.
 */

export const DEVICE_TYPES = {
  AUDIO_EFFECT: 'aaaa',
  MIDI_EFFECT: 'mmmm',
  INSTRUMENT: 'iiii'
};

export const DEFAULT_APP_VERSION = {
  major: 9,
  minor: 1,
  revision: 5,
  architecture: 'x64',
  modernui: 1
};

export const AMXD_HEADER = {
  MAGIC: 'ampf',
  META: 'meta',
  PTCH: 'ptch',
  CHUNK_LEN: 4,
  HEADER_SIZE: 32
};

export const LIVE_PATHS = {
  ABLETON_EXE: 'C:\\ProgramData\\Ableton\\Live 12 Suite\\Program\\Ableton Live 12 Suite.exe',
  MAX_EXE: 'C:\\ProgramData\\Ableton\\Live 12 Suite\\Resources\\Max\\Max.exe',
  USER_LIBRARY: 'C:\\Users\\Max\\Documents\\Ableton\\User Library',
  AUDIO_PRESETS: 'C:\\Users\\Max\\Documents\\Ableton\\User Library\\Presets\\Audio Effects\\Max Audio Effect',
  MIDI_PRESETS: 'C:\\Users\\Max\\Documents\\Ableton\\User Library\\Presets\\MIDI Effects\\Max MIDI Effect',
  INSTRUMENT_PRESETS: 'C:\\Users\\Max\\Documents\\Ableton\\User Library\\Presets\\Instruments\\Max Instrument'
};

export const UI_UNITS = {
  INT: 0,
  FLOAT: 1,
  TIME_MS: 2,
  HERTZ: 3,
  DECIBEL: 4,
  PERCENT: 5,
  PAN: 6,
  SEMITONE: 7,
  MIDI_NOTE: 8,
  CUSTOM: 9
};
