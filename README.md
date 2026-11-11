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
