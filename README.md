# CNG Fare BD 🛺

**Know the meter fare before you ride.** An offline, bilingual (EN/বাংলা) CNG auto-rickshaw fare estimator for Bangladesh — built on the official BRTA meter fare.

## The problem

CNG auto-rickshaw drivers in Dhaka and Chattogram routinely refuse the meter and demand inflated flat fares. Most passengers don't know the official rate, so they can't tell whether they're being overcharged — or by how much.

## Features

1. **Fare calculator** — enter distance (km) and waiting time (minutes); get the exact meter fare with a full breakdown.
2. **Popular Dhaka routes** — 12 common routes with approximate distances; tap one to load it into the calculator.
3. **Overcharge checker** — enter what the driver demanded and see instantly whether it matches the meter, how much extra it is, and by what percentage — plus the legal position (Road Transport Act 2018).
4. **Meter fare table** — 1–30 km at a glance (0 waiting).
5. **Trip log** — log each ride (from/to, distance, waiting, amount paid); see totals paid vs total overpaid, persisted in localStorage, exportable as JSON, erasable with typed confirmation.
6. **Bilingual EN/বাংলা** — full UI toggle with Bengali digits; responsive down to 390 px; zero network requests — works fully offline.

## The official fare (verified)

| Item | Rate |
|---|---|
| First 2 km (minimum fare) | **Tk 40** |
| Each km beyond 2 km | **Tk 12** |
| Waiting | **Tk 2 per minute** |

Revised by the government in **November 2015** and still the gazetted rate — confirmed as current by The Business Standard (11 Feb 2025) and the Financial Express (17 Feb 2025). Under the Road Transport Act 2018 (s. 35(3) & s. 81) a driver must charge by the meter; overcharging can mean a fine of up to Tk 50,000 and/or up to 6 months' jail. Note: BRTA withdrew its February 2025 enforcement-drive order on 16 February 2025 — the fare itself is unchanged. Complaints: BRTA — [brta.gov.bd](https://brta.gov.bd).

**Sources**

- The Daily Star, "Govt hikes bus, auto-rickshaw fares" (11 Sep 2015): https://www.thedailystar.net/country/news/govt-hikes-bus-auto-rickshaw-fares-140869
- The Business Standard, "Overcharging: Punishment for CNG auto-rickshaw drivers set to be reinforced" (11 Feb 2025): https://www.tbsnews.net/bangladesh/cng-drivers-face-tk50000-fine-6-months-imprisonment-charging-fare-higher-meter-1066706
- The Business Standard, "BRTA backtracks from reinforcing punishment…" (16 Feb 2025): https://www.tbsnews.net/bangladesh/brta-backtracks-reinforcing-punishment-cng-autorickshaw-drivers-violating-meter-fare
- The Financial Express, "BRTA's order on meter-based fares of CNG auto-rickshaws withdrawn" (17 Feb 2025): https://today.thefinancialexpress.com.bd/last-page/brtas-order-on-meter-based-fares-of-cng-auto-rickshaws-withdrawn-1739730677

## Worked examples

| Trip | Meter fare |
|---|---|
| 1 km, no waiting | Tk 40 (minimum) |
| 5 km, no waiting | 40 + 3 × 12 = **Tk 76** |
| 5 km + 10 min waiting | 76 + 10 × 2 = **Tk 96** |
| 10 km, no waiting | 40 + 8 × 12 = **Tk 136** |
| Dhanmondi 27 → Gulshan 1 (~8.5 km) | 40 + 6.5 × 12 = **Tk 118** |

Fares are rounded to the nearest whole taka.

## Stack

- Vanilla HTML + CSS + JavaScript — no framework, no build step, no dependencies.
- `logic.js` — pure fare math (testable in Node and the browser).
- `i18n.js` — EN/বাংলা strings.
- `app.js` — UI wiring, localStorage trip log.

## Run locally

```bash
# any static server, or just open index.html in a browser
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Testing

```bash
node test.js        # 28 unit tests (fare math, overcharge, table, validation, routes)
```

Headless-Chrome smoke tests (desktop 1440 px + mobile 390 px, raw CDP against `file://`): see `TEST_RESULTS.md` — 30/30 checks passed, 0 console/page errors.

## Limitations

- **Route distances are approximate** road distances, labelled as such in the app. The meter reading — not this app — is the fare. If you know a route's exact distance, use the manual distance field.
- The app cannot know real-time traffic or how long a driver actually waits; waiting minutes are entered by you.
- Fare law is summarised for passengers; it is not legal advice. The BRTA fare can change — check brta.gov.bd.
- Trip log lives in the browser's localStorage on one device; export JSON to keep a copy.

## Status

MVP complete. Static site, deployable to GitHub Pages as-is.
