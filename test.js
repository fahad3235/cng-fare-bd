/* cng-fare-bd — Node unit tests for logic.js. Run: node test.js */
'use strict';
const assert = require('node:assert');
const { FIRST_KM, FIRST_FARE, PER_KM, PER_WAIT_MIN, ROUTES, meterFare, checkOvercharge, fareTable, validateTrip } = require('./logic.js');

let passed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log('ok - ' + name); }
  catch (e) { console.error('FAIL - ' + name + ': ' + e.message); process.exitCode = 1; }
}

// --- constants match the gazetted BRTA fare ---
check('constants: Tk 40 first 2 km, Tk 12/km, Tk 2/min waiting', () => {
  assert.strictEqual(FIRST_KM, 2);
  assert.strictEqual(FIRST_FARE, 40);
  assert.strictEqual(PER_KM, 12);
  assert.strictEqual(PER_WAIT_MIN, 2);
});

// --- meterFare ---
check('0 km = minimum Tk 40', () => assert.strictEqual(meterFare(0, 0).fare, 40));
check('1 km = Tk 40', () => assert.strictEqual(meterFare(1, 0).fare, 40));
check('2 km = Tk 40 (boundary)', () => assert.strictEqual(meterFare(2, 0).fare, 40));
check('3 km = 40 + 12 = Tk 52', () => assert.strictEqual(meterFare(3, 0).fare, 52));
check('5 km = 40 + 3*12 = Tk 76', () => assert.strictEqual(meterFare(5, 0).fare, 76));
check('10 km = 40 + 8*12 = Tk 136', () => assert.strictEqual(meterFare(10, 0).fare, 136));
check('8.5 km = 40 + 6.5*12 = Tk 118', () => assert.strictEqual(meterFare(8.5, 0).fare, 118));
check('waiting: 5 km + 10 min = 76 + 20 = Tk 96', () => assert.strictEqual(meterFare(5, 10).fare, 96));
check('waiting only: 0 km + 30 min = 40 + 60 = Tk 100', () => assert.strictEqual(meterFare(0, 30).fare, 100));
check('fractional fare rounds to whole taka: 2.5 km = 40 + 6 = 46', () => assert.strictEqual(meterFare(2.5, 0).fare, 46));
check('breakdown fields are correct', () => {
  const r = meterFare(5, 10);
  assert.strictEqual(r.base, 76);
  assert.strictEqual(r.waitCharge, 20);
  assert.strictEqual(r.km, 5);
  assert.strictEqual(r.waitMin, 10);
});
check('negative km throws', () => assert.throws(() => meterFare(-1, 0), /Distance/));
check('NaN km throws', () => assert.throws(() => meterFare(NaN, 0), /Distance/));
check('negative waiting throws', () => assert.throws(() => meterFare(5, -1), /Waiting/));

// --- checkOvercharge ---
check('fair: demanded == meter', () => {
  const r = checkOvercharge(5, 0, 76);
  assert.strictEqual(r.verdict, 'fair');
  assert.strictEqual(r.over, 0);
});
check('over: 5 km, demanded 150 -> over Tk 74 (97.4%)', () => {
  const r = checkOvercharge(5, 0, 150);
  assert.strictEqual(r.meter, 76);
  assert.strictEqual(r.over, 74);
  assert.strictEqual(r.verdict, 'over');
  assert.strictEqual(r.overPct, 97.4);
});
check('under: demanded below meter', () => {
  const r = checkOvercharge(5, 0, 50);
  assert.strictEqual(r.verdict, 'under');
  assert.strictEqual(r.over, -26);
});
check('overcharge with waiting counted: 3 km + 10 min, meter 72', () => {
  const r = checkOvercharge(3, 10, 100);
  assert.strictEqual(r.meter, 72);
  assert.strictEqual(r.over, 28);
});
check('negative demanded throws', () => assert.throws(() => checkOvercharge(5, 0, -10), /Demanded/));

// --- fareTable ---
check('fareTable(5) = [40,40,52,64,76]', () => {
  assert.deepStrictEqual(fareTable(5).map((r) => r.fare), [40, 40, 52, 64, 76]);
});
check('fareTable(30) ends at Tk 376', () => {
  const t = fareTable(30);
  assert.strictEqual(t.length, 30);
  assert.strictEqual(t[29].fare, 376); // 40 + 28*12
});
check('fareTable rejects 0 and 101', () => {
  assert.throws(() => fareTable(0));
  assert.throws(() => fareTable(101));
});

// --- validateTrip ---
check('validateTrip accepts a good trip', () => {
  assert.deepStrictEqual(validateTrip({ km: 5, waitMin: 10, paid: 120, from: 'A', to: 'B' }), []);
});
check('validateTrip rejects km 0 / 201 / NaN', () => {
  assert.ok(validateTrip({ km: 0, waitMin: 0, paid: 40 }).includes('km'));
  assert.ok(validateTrip({ km: 201, waitMin: 0, paid: 40 }).includes('km'));
  assert.ok(validateTrip({ km: NaN, waitMin: 0, paid: 40 }).includes('km'));
});
check('validateTrip rejects bad waitMin and paid', () => {
  assert.ok(validateTrip({ km: 5, waitMin: -1, paid: 40 }).includes('waitMin'));
  assert.ok(validateTrip({ km: 5, waitMin: 601, paid: 40 }).includes('waitMin'));
  assert.ok(validateTrip({ km: 5, waitMin: 0, paid: -1 }).includes('paid'));
  assert.ok(validateTrip({ km: 5, waitMin: 0, paid: 100001 }).includes('paid'));
});
check('validateTrip rejects over-long from/to', () => {
  assert.ok(validateTrip({ km: 5, waitMin: 0, paid: 40, from: 'x'.repeat(81) }).includes('from'));
});

// --- routes data ---
check('ROUTES: 12 Dhaka routes, all km in 1..20', () => {
  assert.strictEqual(ROUTES.length, 12);
  ROUTES.forEach((r) => {
    assert.ok(r.from && r.to, 'route needs from/to');
    assert.ok(r.km >= 1 && r.km <= 20, 'route km range: ' + r.km);
    assert.strictEqual(meterFare(r.km, 0).fare, 40 + Math.max(0, r.km - 2) * 12);
  });
});

console.log('\n' + passed + ' tests passed.');
