inlets = 2;
outlets = 1;

setinletassist(0, 'Rate clock bang');
setinletassist(1, 'Parameters: amount 0-100');
setoutletassist(0, 'Binary random control: 0 or 1');

const state = { amount: 100 };

function bang() {
  const binary = Math.random() < 0.5 ? 1 : 0;
  const output = binary && Math.random() * 100 >= 100 - state.amount ? 1 : 0;
  outlet(0, output);
}

function msg_int(value) {
  if (inlet === 1) amount(value);
  else bang();
}

function msg_float(value) {
  if (inlet === 1) amount(value);
  else bang();
}

function amount(value) {
  state.amount = Math.max(0, Math.min(100, Number(value) || 0));
}
