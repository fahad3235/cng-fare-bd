/* cng-fare-bd — UI wiring. Depends on logic.js and i18n.js. */
'use strict';

const $ = (id) => document.getElementById(id);
const LS_TRIPS = 'cngFareBd.trips.v1';
const LS_LANG = 'cngFareBd.lang.v1';

let lang = localStorage.getItem(LS_LANG) || 'en';
if (!I18N[lang]) lang = 'en';

const BN_DIGITS = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
function fmt(n) {
  const s = String(n);
  return lang === 'bn' ? s.replace(/[0-9]/g, (d) => BN_DIGITS[d]) : s;
}
function t(key) { return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key; }
function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : ''));
}

function loadTrips() {
  try {
    const raw = localStorage.getItem(LS_TRIPS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => validateTrip(x).length === 0) : [];
  } catch (_) { return []; }
}
function saveTrips(trips) {
  try { localStorage.setItem(LS_TRIPS, JSON.stringify(trips)); } catch (_) { /* storage full/blocked: log stays in memory only */ }
}
let trips = loadTrips();

function showErr(el, msg) {
  if (!msg) { el.hidden = true; el.textContent = ''; return; }
  el.hidden = false; el.textContent = msg;
}

function applyI18n() {
  document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  $('langBtn').textContent = t('langBtn');
  renderRoutes();
  renderTable();
  renderLog();
  // Re-render any visible results in the new language.
  if (!$('calcResult').hidden) doCalc(true);
  if (!$('overResult').hidden) doCheck(true);
}

function currentInputs() {
  const km = parseFloat($('kmInput').value);
  const waitMin = $('waitInput').value === '' ? 0 : parseFloat($('waitInput').value);
  return { km, waitMin };
}

function doCalc(silent) {
  const { km, waitMin } = currentInputs();
  if (!Number.isFinite(km) || km < 0 || km > 200) {
    if (!silent) showErr($('calcErr'), t('invalidKm'));
    return null;
  }
  if (!Number.isFinite(waitMin) || waitMin < 0 || waitMin > 600) {
    if (!silent) showErr($('calcErr'), t('invalidWait'));
    return null;
  }
  showErr($('calcErr'), '');
  let r;
  try { r = meterFare(km, waitMin); } catch (e) { showErr($('calcErr'), e.message); return null; }
  $('fareValue').textContent = '৳ ' + fmt(r.fare);
  $('fareBreakdown').textContent = fill(t('breakdown'), { base: fmt(r.base), km: fmt(km), wait: fmt(r.waitCharge), min: fmt(waitMin) });
  $('calcResult').hidden = false;
  return r;
}

function doCheck(silent) {
  const { km, waitMin } = currentInputs();
  const demanded = parseFloat($('demandedInput').value);
  if (!Number.isFinite(km) || km < 0 || km > 200) {
    if (!silent) showErr($('overErr'), t('invalidKm'));
    return null;
  }
  if (!Number.isFinite(waitMin) || waitMin < 0 || waitMin > 600) {
    if (!silent) showErr($('overErr'), t('invalidWait'));
    return null;
  }
  if (!Number.isFinite(demanded) || demanded < 0) {
    if (!silent) showErr($('overErr'), t('invalidDemanded'));
    return null;
  }
  showErr($('overErr'), '');
  let r;
  try { r = checkOvercharge(km, waitMin, demanded); } catch (e) { showErr($('overErr'), e.message); return null; }
  const el = $('overResult');
  el.hidden = false;
  el.classList.toggle('bad', r.verdict === 'over');
  el.classList.toggle('good', r.verdict !== 'over');
  if (r.verdict === 'fair') {
    $('overValue').textContent = t('fair');
    $('overDetail').textContent = '৳ ' + fmt(r.meter);
  } else if (r.verdict === 'over') {
    $('overValue').textContent = fill(t('over'), { over: fmt(r.over), pct: fmt(r.overPct) });
    $('overDetail').textContent = 'Meter ৳ ' + fmt(r.meter) + ' · ' + (lang === 'bn' ? 'চাওয়া হয়েছে' : 'Demanded') + ' ৳ ' + fmt(r.demanded);
  } else {
    $('overValue').textContent = fill(t('under'), { over: fmt(Math.abs(r.over)) });
    $('overDetail').textContent = 'Meter ৳ ' + fmt(r.meter) + ' · ' + (lang === 'bn' ? 'চাওয়া হয়েছে' : 'Demanded') + ' ৳ ' + fmt(r.demanded);
  }
  return r;
}

function renderRoutes() {
  const list = $('routeList');
  list.innerHTML = '';
  ROUTES.forEach((r) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'route-chip';
    const fare = meterFare(r.km, 0).fare;
    b.innerHTML = '<span class="route-names"></span><span class="route-meta"></span>';
    b.querySelector('.route-names').textContent = r.from + ' → ' + r.to;
    b.querySelector('.route-meta').textContent = fmt(r.km) + ' ' + t('kmSuffix') + ' · ৳ ' + fmt(fare);
    b.addEventListener('click', () => {
      $('kmInput').value = r.km;
      $('waitInput').value = 0;
      $('fromInput').value = r.from;
      $('toInput').value = r.to;
      doCalc();
      $('calcBtn').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    list.appendChild(b);
  });
}

function renderTable() {
  const tbody = document.querySelector('#fareTable tbody');
  tbody.innerHTML = '';
  fareTable(30).forEach((row) => {
    const tr = document.createElement('tr');
    const tdKm = document.createElement('td'); tdKm.textContent = fmt(row.km);
    const tdFare = document.createElement('td'); tdFare.textContent = '৳ ' + fmt(row.fare);
    tr.appendChild(tdKm); tr.appendChild(tdFare);
    tbody.appendChild(tr);
  });
}

function renderLog() {
  const list = $('logList');
  list.innerHTML = '';
  $('logEmpty').hidden = trips.length > 0;
  const summary = $('logSummary');
  if (trips.length === 0) { summary.hidden = true; return; }
  let totalPaid = 0, totalOver = 0;
  trips.forEach((trip) => {
    const meter = meterFare(trip.km, trip.waitMin).fare;
    const over = Math.max(0, trip.paid - meter);
    totalPaid += trip.paid; totalOver += over;
  });
  summary.hidden = false;
  summary.innerHTML = '';
  const s1 = document.createElement('span');
  s1.textContent = fmt(trips.length) + ' ' + t('trips') + ' · ' + t('totalPaid') + ': ৳ ' + fmt(totalPaid) + ' · ' + t('totalOver') + ': ৳ ' + fmt(totalOver);
  summary.appendChild(s1);
  [...trips].reverse().forEach((trip) => {
    const meter = meterFare(trip.km, trip.waitMin).fare;
    const over = trip.paid - meter;
    const div = document.createElement('div');
    div.className = 'log-item' + (over > 0 ? ' over' : '');
    const d = new Date(trip.ts);
    const dateStr = d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short' });
    div.innerHTML = '<div class="log-main"></div><div class="log-amount"></div>';
    div.querySelector('.log-main').textContent =
      (trip.from && trip.to ? trip.from + ' → ' + trip.to + ' · ' : '') +
      fmt(trip.km) + ' ' + t('kmSuffix') + ' · ' + dateStr;
    div.querySelector('.log-amount').textContent =
      '৳ ' + fmt(trip.paid) + ' (' + (lang === 'bn' ? 'মিটার' : 'meter') + ' ৳ ' + fmt(meter) + (over > 0 ? ' · +' + fmt(over) : '') + ')';
    list.appendChild(div);
  });
}

function doLog() {
  const { km, waitMin } = currentInputs();
  const paid = parseFloat($('paidInput').value);
  const trip = {
    km, waitMin, paid,
    from: $('fromInput').value.trim(),
    to: $('toInput').value.trim(),
    ts: Date.now()
  };
  const errs = validateTrip(trip);
  if (errs.includes('km')) { showErr($('logErr'), t('invalidKm')); return; }
  if (errs.includes('waitMin')) { showErr($('logErr'), t('invalidWait')); return; }
  if (errs.includes('paid')) { showErr($('logErr'), t('invalidPaid')); return; }
  showErr($('logErr'), '');
  trips.push(trip);
  saveTrips(trips);
  renderLog();
  $('paidInput').value = '';
}

$('calcBtn').addEventListener('click', () => doCalc());
$('checkBtn').addEventListener('click', () => doCheck());
$('logBtn').addEventListener('click', doLog);
$('langBtn').addEventListener('click', () => {
  lang = lang === 'en' ? 'bn' : 'en';
  try { localStorage.setItem(LS_LANG, lang); } catch (_) { /* ignore */ }
  applyI18n();
});
$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(trips, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cng-fare-bd-trips.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$('clearBtn').addEventListener('click', () => {
  if (trips.length === 0) return;
  if (!window.confirm(t('clearConfirm'))) return;
  trips = [];
  saveTrips(trips);
  renderLog();
});

applyI18n();
