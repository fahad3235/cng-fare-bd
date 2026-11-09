# TEST_RESULTS.md — cng-fare-bd (run #283, 13:00 slot, 2026-11-09)

## Unit tests — 28/28 passed

`node test.js` — 2026-11-09 ~13:20 +06. All assertions real, none invented.

- Constants match the gazetted BRTA fare: Tk 40 first 2 km, Tk 12/km, Tk 2/min waiting.
- meterFare: 0 km = 40; 1 km = 40; 2 km = 40 (boundary); 3 km = 52; 5 km = 76; 10 km = 136; 8.5 km = 118; 5 km + 10 min = 96; 0 km + 30 min = 100; 2.5 km rounds to 46; breakdown fields correct.
- Errors: negative/NaN km and negative waiting throw.
- checkOvercharge: fair at demanded == meter; 5 km demanded 150 → over Tk 74 (97.4%); under at 50 → −26; waiting counted (3 km + 10 min → meter 72, over 28); negative demanded throws.
- fareTable(5) = [40, 40, 52, 64, 76]; fareTable(30) ends at Tk 376; rejects 0 and 101.
- validateTrip: accepts a good trip; rejects km 0/201/NaN, waitMin −1/601, paid −1/100001, over-long from/to.
- ROUTES: 12 Dhaka routes, all km in 1–20, each fare consistent with the formula.

## Headless-Chrome smoke tests — 30/30 passed

Raw CDP against `file://` (`headless_shell-1187`), `/tmp/smoke-cng.mjs` — 2026-11-09 ~13:25 +06. Desktop 1440×900 and mobile 390×844, 15 checks each:

- Title loads; 12 route chips render; fare table has 30 rows.
- Calc 5 km + 10 min = ৳ 96; breakdown shows 76 + 20.
- Overcharge: demanded 150 on 5 km/0 waiting = over Tk 74.
- Route chip loads km 8.5 into the calculator.
- Invalid km (−3) shows an inline error.
- Trip log records 1 trip; summary shows total overpaid Tk 74.
- Bangla toggle switches the title (ভাড়া) and renders Bengali digits (৭৬).
- No horizontal overflow at either viewport.
- Zero console/page errors at either viewport.

### Fixes during testing (all test-harness, not app bugs)

1. CDP harness: `Target.createTarget` returns a targetId, not a sessionId — switched to `Target.attachToTarget` with `flatten: true`. (Harness bug.)
2. Overcharge expectation: first run left waiting = 10 min from the calc test, so meter was 96, not 76 — harness now zeroes waiting first. (Harness bug.)
3. Bangla digit expectation: after a page reload the result panel is hidden until a calc runs — harness now clicks Calculate before checking digits. (Harness bug; the app correctly shows nothing until the user calculates.)
4. Mobile trip-log count: localStorage persisted across the two viewport runs in the same page — harness now clears + reloads before logging per viewport. (Harness bug.)

No app code was changed after the first smoke run; all 4 fixes were harness-side.

## Manual verification

- Fare rates verified by web search before build: Daily Star 2015-09-11 (Tk 40 / Tk 12 / Tk 2 per min), TBS 2025-02-11 & 2025-02-16 (fare still current; enforcement order withdrawn 16 Feb 2025), Financial Express 2025-02-17.
- GitHub uniqueness: `user:fahad3235 cng` = 0 repos; `user:fahad3235 fare` = rickshaw-fare-bd, metro-fare-bd, bus-fare-bd only.
- Ledger + builds/ re-checked before building: no `cng-fare-bd` run, repo, or build directory existed.
