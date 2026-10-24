/**
 * Live Object Model (LOM) Helper for Cycling '74 Max 9's v8 object.
 * Provides clean asynchronous and reactive wrappers around LiveAPI.
 */

// Max JS environment properties
inlets = 1;
outlets = 2;

setinletassist(0, 'Commands: tempo, play, stop, get_tracks, set_param [track] [device] [param] [value]');
setoutletassist(0, 'LOM results / values');
setoutletassist(1, 'Status & Error messages');

let tempoObserver = null;

function init() {
  if (typeof LiveAPI === 'undefined') {
    outlet(1, 'Warning: LiveAPI not available (running outside Ableton Live context)');
    return;
  }

  try {
    // Observe song tempo
    tempoObserver = new LiveAPI(onTempoChanged, 'live_set');
    tempoObserver.property = 'tempo';
    outlet(1, 'LOM Bridge Initialized: Observing live_set');
  } catch (err) {
    outlet(1, 'LiveAPI init error: ' + err.message);
  }
}

function onTempoChanged(args) {
  if (args[0] === 'tempo') {
    outlet(0, ['tempo', args[1]]);
  }
}

/**
 * Read current song tempo
 */
function get_tempo() {
  if (typeof LiveAPI === 'undefined') return;
  const song = new LiveAPI('live_set');
  const tempo = song.get('tempo');
  outlet(0, ['tempo', tempo]);
}

/**
 * Read track count
 */
function get_tracks() {
  if (typeof LiveAPI === 'undefined') return;
  const song = new LiveAPI('live_set');
  const tracks = song.get('tracks');
  // tracks is returned as an array of 'id X' tokens
  const count = tracks.length / 2;
  outlet(0, ['track_count', count]);
}

/**
 * Set transport playing state
 */
function play() {
  if (typeof LiveAPI === 'undefined') return;
  const song = new LiveAPI('live_set');
  song.set('is_playing', 1);
}

function stop() {
  if (typeof LiveAPI === 'undefined') return;
  const song = new LiveAPI('live_set');
  song.set('is_playing', 0);
}
