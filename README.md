## V1.6 — Firebase Auth wired (2026-11-11)

MOA's GitHub Pages client has been configured for the **new independent Firebase project** `moa-travel-1b87d` (not Shanghai V14). Public Firebase web app configuration is in `firebase-config.js`, without any private service-account key.

UI: email/password sign-up (nickname, password confirmation), email verification and resend, login, password-reset email, optional Google sign-in, logout, and explicit options to upload current local trips or replace with cloud trips. The local data key remains unchanged. Cloud synchronization is enabled only after the user elects upload/load, not merely upon signing in.

**Firebase Console actions still required (not deployed by GitHub):**
1. Authentication > Sign-in method: enable Email/Password and Google.
2. Authentication > Settings > Authorized domains: add `jjh970104-bot.github.io`.
3. Firestore Database: create a database in the **MOA** project.
4. Firestore > Rules: paste the complete `firestore.rules` file from this repository and click **Publish**. Deploying to GitHub does NOT publish Firebase rules.
5. Test account registration, Firebase verification email, and cloud upload/load with dummy data; use separate browsers/devices to test after preserving a JSON backup.

**Not production-ready:** no account deletion, privacy/legal pages, rate limits, session-scoped local-data isolation, or multi-user edit conflict resolution yet. On a shared browser, prior local travel data may remain after sign-out; do not test with personal travel data on shared devices. The prototype stores a trip array in a single Firestore document.

## V1.5.1 — Daily itinerary includes accommodation and transport
- The day planner and route sequence now combine accommodation, transportation bookings and ordinary stops.
- Accommodation active on a date (from check-in to checkout) appears first in the list and route; transport bookings for that day follow, ordered by departure time, then manually ordered places.
- Existing stay and transportation records are **referenced**, not duplicated as ordinary stops. Editing booking data updates the day view automatically; deletion removes it without orphan copies.
- Route map pins are only shown for entries with saved coordinates. Accommodation/transport can appear in numbered route lists before they have map coordinates.
- Drag-and-drop continues to reorder ordinary stops only; fixed booking priority is intentional.
- Existing browser storage key and Shanghai V14 remain unchanged.

## V1.5 — UI and itinerary improvements (2026-11-11)
- Compact drag handle and larger numbered badges for ordered day stops.
- Quick-add removed from the schedule to avoid duplicate entry interfaces.
- Accommodation management: check-in/check-out dates, time, address and notes. Stays appear on each day from check-in through checkout (checkout labeled as departure day).
- Transport management: flights, train, bus, ferry, rental car, etc., with date/time and route. A booking appears on its departure date.
- Geo search: manual button click works without an API key through Nominatim/OpenStreetMap for light personal testing; optional Geoapify key may be configured for its alternative geocoding.
- Editing modal now hides the underlying map and has a stacking order above Leaflet.
- Local storage key unchanged; Shanghai V14 remains untouched.

### Important map limitations
The free Nominatim public service is rate-limited and **not suitable as a production-scale geocoder**. Never enable client-side autocomplete over public Nominatim. The current request is only sent on explicit Search button presses, with a client cooldown; for a public multiuser service, provision a commercial or self-hosted search backend. OSM map tiles may also be throttled or fail in some regions. Geoapify browser keys must be restricted by referrer and usage limits. Map pins need selected coordinates; typed-only addresses do not automatically receive coordinates.

# 모아(MOA) V1.4

Standalone travel planner hosted on GitHub Pages. This repository is entirely separate from Shanghai V14.

## What's new
- Drag and drop itinerary reorder on desktop, and move up/down buttons on mobile.
- Leaflet/OpenStreetMap route map with numbered pins for selected locations. Connecting lines are **straight**, not road directions.
- Place search via Geoapify Autocomplete when the user enters their own Geoapify API key under 장소 편집 → 검색 설정. The key stays in that browser.
- Opt-in Google sign-in and cloud backup/sync via Firebase Auth and Firestore, pending configuration of a **new independent MOA Firebase project**.

## Firebase setup — required before Google login works
1. Create a NEW Firebase project in https://console.firebase.google.com/. **Do not use Shanghai V14.**
2. Register a web app and copy the firebaseConfig object.
3. In Authentication → Sign-in method, enable Google.
4. In Authentication → Settings → Authorized domains, allow `jjh970104-bot.github.io`.
5. Create a Cloud Firestore database and publish the security rules from `firestore.rules`.
6. Visit the MOA site → 계정/저장 → paste the firebaseConfig JSON → save → Google 로그인.
7. Back up local trips to JSON before choosing to upload local trips or replace them with your cloud trips. Once activated, future local changes are queued for cloud saving.

## Safety and limitations
- Until Firebase is configured, data remains browser-local under `moa-v1-trips-independent-2026`.
- Cloud mode stores a user's trip array in one Firestore document for this **prototype**. It is not suitable for multi-user collaborative editing, high-volume accounts, or concurrent edits on multiple devices.
- An existing cloud copy is never intentionally overwritten during setup without confirmation; maintain JSON backups.
- Geoapify API key must be restricted to trusted origin/referrers in provider settings and replaced by a server-managed integration before public-scale use.
- Leaflet map attribution and OSM tile provider policy apply. Use a scalable tile provider before broad public launch.
- Route lines are visual sequence guides only: no road-based route planning, accurate distance or ETA calculations.
- Firebase config JSON for web apps is not an admin secret, but never upload service account keys or private credentials.
