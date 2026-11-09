/* cng-fare-bd — pure fare logic (no DOM). Testable in Node and the browser.
 * Official BRTA meter fare for CNG auto-rickshaws (Dhaka & Chattogram),
 * revised Nov 2015, still the gazetted rate per TBS Feb 2025:
 *   first 2 km ......... Tk 40 (minimum fare)
 *   each km beyond 2 .. Tk 12
 *   waiting ............ Tk 2 per minute
 * Sources: The Daily Star 2015-09-11; TBS 2025-02-11 & 2025-02-16;
 * Financial Express 2025-02-17. See README for links.
 */
'use strict';

const FIRST_KM = 2;
const FIRST_FARE = 40;   // Tk for the first 2 km (also the minimum fare)
const PER_KM = 12;       // Tk per km beyond the first 2 km
const PER_WAIT_MIN = 2;  // Tk per minute of waiting

// Popular Dhaka routes. Distances are APPROXIMATE road distances
// (labelled as such in the UI and README) — the meter, not this table,
// is what a passenger should pay. Edit with better data any time.
const ROUTES = [
  { from: 'Dhanmondi 27', to: 'Gulshan 1', km: 8.5 },
  { from: 'Mirpur 10', to: 'Motijheel', km: 11.0 },
  { from: 'Uttara Sector 4', to: 'Banani', km: 7.0 },
  { from: 'Mohammadpur', to: 'Farmgate', km: 4.0 },
  { from: 'Bashundhara R/A', to: 'Gulshan 2', km: 4.5 },
  { from: 'Sadarghat', to: 'Dhanmondi 27', km: 6.0 },
  { from: 'Jatrabari', to: 'Gulshan 1', km: 10.0 },
  { from: 'Tejgaon', to: 'Airport', km: 9.0 },
  { from: 'Khilgaon', to: 'Motijheel', km: 5.0 },
  { from: 'Banani', to: 'Dhanmondi 27', km: 7.0 },
  { from: 'Mirpur DOHS', to: 'Uttara Sector 4', km: 8.0 },
  { from: 'Lalbagh', to: 'Farmgate', km: 4.5 }
];

function roundTaka(n) { return Math.round(n); }

/**
 * Meter fare for a trip.
 * @param {number} km - distance in kilometres (>= 0)
 * @param {number} waitMin - waiting minutes (>= 0)
 * @returns {{fare:number, base:number, waitCharge:number, km:number, waitMin:number}}
 * @throws {Error} on invalid input
 */
function meterFare(km, waitMin) {
  if (typeof km !== 'number' || !Number.isFinite(km) || km < 0) {
    throw new Error('Distance must be a number >= 0.');
  }
  if (typeof waitMin !== 'number' || !Number.isFinite(waitMin) || waitMin < 0) {
    throw new Error('Waiting minutes must be a number >= 0.');
  }
  const base = km <= FIRST_KM ? FIRST_FARE : FIRST_FARE + (km - FIRST_KM) * PER_KM;
  const waitCharge = waitMin * PER_WAIT_MIN;
  return {
    fare: roundTaka(base + waitCharge),
    base: roundTaka(base),
    waitCharge: roundTaka(waitCharge),
    km,
    waitMin
  };
}

/**
 * Compare what a driver demands with the meter fare.
 * @returns {{meter:number, demanded:number, over:number, overPct:number|null, verdict:'fair'|'over'|'under'}}
 */
function checkOvercharge(km, waitMin, demanded) {
  if (typeof demanded !== 'number' || !Number.isFinite(demanded) || demanded < 0) {
    throw new Error('Demanded fare must be a number >= 0.');
  }
  const meter = meterFare(km, waitMin).fare;
  const over = roundTaka(demanded - meter);
  const overPct = meter > 0 ? Math.round((over / meter) * 1000) / 10 : null;
  return {
    meter,
    demanded: roundTaka(demanded),
    over,
    overPct,
    verdict: over > 0 ? 'over' : (over < 0 ? 'under' : 'fair')
  };
}

/** Fare table rows for 1..maxKm km (0 waiting). */
function fareTable(maxKm) {
  if (!Number.isInteger(maxKm) || maxKm < 1 || maxKm > 100) {
    throw new Error('maxKm must be an integer between 1 and 100.');
  }
  const rows = [];
  for (let km = 1; km <= maxKm; km++) rows.push({ km, fare: meterFare(km, 0).fare });
  return rows;
}

/** Validate a trip-log entry. Returns an array of error keys (empty = valid). */
function validateTrip(t) {
  const errors = [];
  if (!t || typeof t !== 'object') return ['invalid'];
  if (typeof t.km !== 'number' || !Number.isFinite(t.km) || t.km <= 0 || t.km > 200) errors.push('km');
  if (typeof t.waitMin !== 'number' || !Number.isFinite(t.waitMin) || t.waitMin < 0 || t.waitMin > 600) errors.push('waitMin');
  if (typeof t.paid !== 'number' || !Number.isFinite(t.paid) || t.paid < 0 || t.paid > 100000) errors.push('paid');
  if (t.from !== undefined && (typeof t.from !== 'string' || t.from.length > 80)) errors.push('from');
  if (t.to !== undefined && (typeof t.to !== 'string' || t.to.length > 80)) errors.push('to');
  return errors;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FIRST_KM, FIRST_FARE, PER_KM, PER_WAIT_MIN, ROUTES, meterFare, checkOvercharge, fareTable, validateTrip, roundTaka };
}
