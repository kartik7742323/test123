# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server only (frontend, port 5173+; proxies `/api` to `localhost:3001`)
- `npm run server` — start the Express backend only (`server.cjs`, port 3001)
- `npm start` — run both dev server and backend concurrently (typical local dev command)
- `npm run build` — production build to `dist/` (Vite)
- `npm run preview` — preview the production build locally

There is no test suite and no linter configured in this repo.

## Architecture

This is a Meritto internal analytics dashboard ("Mio Adoption Analytics") that visualizes product-adoption data pulled live from a Google Sheet. React + Vite frontend, with a backend that exists in **two parallel implementations** for two different deploy targets:

- `server.cjs` — a long-running Express server used for **local development** (`npm run server` / `npm start`). Vite proxies `/api/*` to it (see `vite.config.js`).
- `api/login.js` and `api/dashboard.js` — **Vercel serverless functions** used in production (see `vercel.json`, which routes `/api/login` and `/api/dashboard` to these files and everything else to the static `dist/` build).

These two backends contain **near-duplicate logic** (data fetching, transformation, auth, encryption). When changing dashboard data-shaping logic, auth, or encryption, the change generally needs to be made in both `server.cjs` and the corresponding `api/*.js` file to keep local dev and production consistent.

### Auth & encryption

- Login is a single hardcoded credential pair (`USERNAME`/`PASSWORD` constants in `server.cjs` and `api/login.js`) — there is no user database.
- On successful login, the server issues a token (`timestamp.hmac-signature`, HMAC-SHA256, 24h expiry) which the client stores in `sessionStorage` (`mio_auth_token`) and sends as a `Bearer` token on `/api/dashboard`.
- Dashboard data is additionally encrypted with AES-256-GCM before being sent to the client (`encrypt()` server-side, `src/crypto.js` `decryptResponse()` client-side) — this is obfuscation on top of the auth token, not a substitute for HTTPS.
- The HMAC secret and AES key are hardcoded constants duplicated across `server.cjs` and `api/*.js` — keep them identical in both places if ever rotated.
- Google Sheets access uses a service account: `GOOGLE_CREDENTIALS` env var (JSON string) is parsed and used via `googleapis` `GoogleAuth`. `.env` holds this locally (git-ignored); it must be set as a Vercel environment variable in production.

### Data pipeline (Google Sheets → dashboard JSON)

Both backends fetch several named tabs from one spreadsheet (`SPREADSHEET_ID`) via the Sheets API and reshape raw rows into the JSON the frontend consumes:

- `All Clients Data`, `Daywise Calls`, `Calls vs connected%` → Mio Voice call-center metrics (KPIs, daily volume, per-client stats, daywise stacked chart).
- `Guide - All Client Data`, `Guide - Daywise Interactions` → Mio Guide (chatbot) metrics, built by `buildGuideData()`. Failures fetching these are non-fatal (Guide tab just shows "no data").
- `Voice Tracker`, `Guide Tracker` → onboarding-pipeline tracking data, built by `buildTrackerData()` (funnel status, ageing buckets, SPOC leaderboard, cohort matrices, stage-wise TAT). Also fetched non-fatally.

Raw sheet rows are accessed by **positional column index** (e.g. `r[10]` = status, `r[17]` = live date for Voice Tracker) — there is no header-name mapping for most sheets except a couple that intentionally do header-based lookups (`headerRow.findIndex(...)` in `buildGuideData`/Daywise parsing to tolerate column reordering). If the underlying spreadsheet's column order changes, the positional-index parsing will silently misread data.

Client/institute names are inconsistent between sheets (e.g. daywise sheets use short names, tracker sheets use full names); `normalizeDaywiseName()` fuzzy-matches short names to the canonical name list.

Server responses are cached in-memory for 5 minutes (`CACHE_TTL` in `server.cjs`; note the Vercel function version has no persistent cache across invocations since each invocation is a fresh process). Pass `?refresh=1` to force a re-fetch from Sheets.

### Frontend structure

- `src/App.jsx` is the single top-level component: holds all fetch/auth/filter state, computes filtered views of the dashboard data via `useMemo`, and switches between tabs. There is no router.
- Global date-range + client multi-select filters (`GlobalFilters.jsx`) are applied client-side in `App.jsx`'s `useMemo` blocks (`filtered` for Voice, `filteredGuide` for Guide) by re-aggregating from `daywiseByClient`/`dailyData` rather than re-fetching — KPIs that can't be recomputed from a date-filtered aggregate (e.g. Guide's `avgMessages`, `activeClients`) fall back to all-time values and are flagged via a `dimmedKpis` set so the UI can visually mark them as approximate.
- Components in `src/components/` are organized by dashboard area, prefixed accordingly: `Guide*` (Mio Guide chatbot tab), `Onboarding*` (onboarding-pipeline tab, consumes the `tracker` data described above), and unprefixed ones (Mio Voice call-center tab).
- Several tabs (`Mio AI Coach`, `Mio Onboarding`, `Mio QC Dashboard`, `Mio Voice Adoption`) are just iframe embeds or CTA links out to separate standalone dashboards (Vercel apps, Zoho Analytics, Power BI) rather than being rendered from the Sheets-derived data — only `voiceAdoption`'s tab label reads "Mio Voice Adoption" but embeds a Power BI report, which is distinct from the in-app `'voice'` tab (full charts built from local data) that is no longer reachable from the tab switcher (its button was replaced by a disabled "Locked" placeholder) but whose render branch is still present in `App.jsx`.
- `src/data/mockData.js` contains static sample data matching the same shape as the live API response — useful as a reference for the expected data contract, not currently wired into `App.jsx`.
