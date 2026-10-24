/**
 * Euclidean Rhythm Core for Max 9's modern v8 JavaScript object.
 * Implements the Bjorklund algorithm to distribute k hits evenly across n steps.
 */

// Max JS environment properties
inlets = 2;
outlets = 2;

setinletassist(0, 'Clock / Metro pulse (bang or int)');
setinletassist(1, 'Parameter messages (steps, hits, rotate, note, velocity, gate)');
setoutletassist(0, 'MIDI Note list [pitch, velocity]');
setoutletassist(1, 'Current step index');

let state = {
  steps: 16,
  hits: 5,
  rotation: 0,
  pitch: 48,
  velocity: 100,
  gateMs: 120,
  currentStep: 0,
  pattern: []
};

/**
 * Bjorklund algorithm for optimal Euclidean spacing
 */
function generateEuclideanPattern(steps, hits, rotation) {
  if (hits <= 0) return new Array(steps).fill(0);
  if (hits >= steps) return new Array(steps).fill(1);

  let pattern = [];
  const slope = hits / steps;
  let previous = -1;

  for (let i = 0; i < steps; i++) {
    const current = Math.floor(i * slope);
    pattern.push(current !== previous ? 1 : 0);
    previous = current;
  }

  // Apply rotation / phase offset
  if (rotation > 0) {
    const r = rotation % steps;
    pattern = pattern.slice(-r).concat(pattern.slice(0, -r));
  }

  return pattern;
}

function updatePattern() {
  state.pattern = generateEuclideanPattern(state.steps, state.hits, state.rotation);
}

// Initial calculation
updatePattern();

/**
 * Triggered on clock pulse (inlet 0)
 */
function bang() {
  if (state.pattern.length === 0) updatePattern();

  const isHit = state.pattern[state.currentStep] === 1;
  const stepOut = state.currentStep;

  // Step forward
  state.currentStep = (state.currentStep + 1) % state.steps;

  // Visual / step indicator output (outlet 1)
  outlet(1, stepOut);

  // If hit, output note-on [pitch, velocity]
  if (isHit) {
    outlet(0, [state.pitch, state.velocity]);
  }
}

/**
 * Handle incoming integer step pulse
 */
function msg_int(val) {
  if (inlet === 0) {
    bang();
  } else {
    state.steps = Math.max(1, Math.min(32, val));
    updatePattern();
  }
}

/**
 * Parameter setters (inlet 1)
 */
function steps(val) {
  state.steps = Math.max(1, Math.min(32, parseInt(val, 10)));
  state.currentStep = state.currentStep % state.steps;
  updatePattern();
}

function hits(val) {
  state.hits = Math.max(0, Math.min(state.steps, parseInt(val, 10)));
  updatePattern();
}

function rotate(val) {
  state.rotation = Math.max(0, Math.min(32, parseInt(val, 10)));
  updatePattern();
}

function note(val) {
  state.pitch = Math.max(0, Math.min(127, parseInt(val, 10)));
}

function velocity(val) {
  state.velocity = Math.max(1, Math.min(127, parseInt(val, 10)));
}

function reset() {
  state.currentStep = 0;
}
