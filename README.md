## MOA V2.11 — Trip list deletion and cloud usability (2026-11-12)

- Existing user accounts **do not need to opt into cloud storage**: V2.10 already introduced automatic verified-user cloud loading and saves to `users/{uid}/data/travel`. Same account on another device fetches server travel docs. This is distinct from collaboration data stored in `collabTrips`.
- In **내 여행**, ordinary personal trip cards now include a **여행 삭제** action. A confirmation is required; deletion is applied to the signed-in user's Firestore document via a transaction before removing the local UID-scoped backup. The action is blocked while other personal-trip writes are pending, on disconnection, and for owner source trips linked to an actively shared collaboration. It does not delete anyone else's shared trip.
- Invited collaboration cards continue to have an explicit **내 목록에서 삭제** button. This only deletes `users/{uid}/collaborations/{tripId}`; it does **not** delete the shared trip or revoke membership. Owner-linked cards are intentionally protected. Shared-trip full deletion/leave workflow remains a separate future feature.
- If initial personal-server loading fails, the signed-in user may see their own **UID-scoped saved trip list** (read-only banner) rather than a blocking screen; `다시 연결` retries Firebase. Private trip opening/modification remains blocked in that fallback to prevent editing a stale copy. On a new device with no local cache, server connection is still required to retrieve saved trips. Invited trips can still be listed from their independent collaboration listener.
- JS syntax and card differentiation tests passed. Actual real-account Firestore transaction, offline recovery, and cross-device state tests require user browser verification. No new security rules required. Independent Shanghai V14 remains untouched.

## MOA V2.10 — Ease of use & safer account storage (2026-11-12)

### User-facing improvements
- **Cover photo**: Trip create/edit allows choosing an image from the photo library or a camera capture (mobile devices supporting `capture="environment"`). The file is resized and JPEG-compressed client-side to a maximum ~45 KB data URL, stored with the trip and displayed on cards/detail. If no picture is chosen, the existing color/emoji cover theme is retained. Photo payload uses existing Firestore trip documents (no separate Storage bucket/rules); a 900 KB serialized personal-trip guard prevents writes close to the Firestore 1 MiB document limit. Very large collections still warrant moving photos to Firebase Storage later.
- **Searchable destinations**: Korean name input offers clickable filtered city/country matches, synonyms such as 상해/상하이 are normalized, and existing country-grouped dropdown + custom destination remain. Search input also selects canonical destination for exact typed aliases.
- **MOA 알아보기**: User-facing guide accessible from the homepage and desktop top nav (`#about`), explaining create, itinerary/expense, participant invitations, simplified travel mode, restricted read-only guest sharing, and account questions.
- Trimmed storage jargon from the default account UI; import/upload/download are available under collapsed `데이터 관리 → 고급 복구 도구`, not as frequent operations.

### Storage stability
- Previously, trips were stored under a **shared browser-local `STORAGE_KEY`**, and the account's Firestore listener was activated only after manual download/upload. Now a verified user's **personal Firestore doc `users/{uid}/data/travel` is fetched automatically from the server on sign-in**; that doc is then subscribed to for cloud updates. Local backup is scoped per Firebase UID at `moa-personal-uid-{uid}-v210`. Signed-out state clears current in-memory personal trips. Shared-trip collaboration continues using its separate Firestore path.
- **No silent overwrite on migration**: The old global localStorage key is retained unchanged. At first eligible sign-in, if legacy browser-only trips differ from the server and no UID-scoped local backup exists, the user is explicitly asked whether to add them. Server trips are preserved; any same-ID, different-content trip is kept as a separate `(기기 보관본)` copy with a fresh ID. If declined, old browser data is retained on the device. Similar confirmed merge applies to divergent UID-scoped backup and server data. The decision is stored per UID so users aren't repeatedly prompted for legacy import.
- When the initial server fetch fails, editing of private trips is blocked rather than overwriting remote data from an empty state. Local copies remain. During subsequent cloud write failures the UID-scoped local backup survives; writes retry with bounded exponential backoff and show a failure message. Cross-device concurrent edits can still conflict: the existing listener stops auto-sync and warns instead of silently choosing a version. This is **not** a full CRDT/transactional per-trip merge.
- Existing cloud/manual recovery routines remain advanced options, and no Firestore rules need updating. No changes to the separate Shanghai V14 planner or its Firebase project.
- **Limitations:** Cloud photos in a single Firestore document consume its capacity and are not suitable for full-size albums. Browser image processing and native speech/camera controls vary by platform. First legacy-data recovery and two-device synchronization must still be verified with a real signed-in user.

### Checks performed
JavaScript parsed for all embedded scripts, simple cover/destination/about UI presence checked, mock authenticated cloud-bootstrap tests passed in 4 conditions (existing remote, opt-in legacy merge, opt-out, fresh account), and merge conflict copies are preserved. **No live Firebase end-to-end or mobile Safari upload test was performed**.

## MOA V2.9 — Integrated itinerary cards & editor (2026-11-12)

- Planning mode shows stop category, status, memo, address and linked expense inline rather than hiding them under a details disclosure. Travel mode remains compact.
- A stop may be a candidate with `alternativeFor` referencing a primary stop ID on the same day. The stop editor now asks users to pick the confirmed/primary stop they are replacing; if available and an alternative is being chosen, the parent is required. Planning view groups candidates immediately under their parent and labels them `후보`, never as an ordinary numbered stop. Candidates not yet linked to a parent continue at the end; travel mode hides them.
- Stop add/edit form combines time, category, planned/confirmed/candidate state, alternative parent, inbound travel transport/duration, location, note, and optional expense amount/currency/status/payer.
- Expense stored in the **existing `expenses[]` collection** with a new optional `linkedStopId` field; each linked stop keeps an `expenseId` pointer. Editing stop cost updates the same existing expense, not a new row. Deleting a stop retains its expense as an unlinked standalone record instead of destroying money data. Removing the amount from the stop editor clears the linked expense; use with care.
- Imported historical stop `cost` is displayed without modification, and matching existing legacy expenses may be reused to avoid duplicate amounts upon editing. All expenses remain in the original per-currency totals. Firebase rules are unchanged; V1.9 shared document merge persists new stop/expense properties.
- For collaborative trips, payer is selected from participant list. For private trips it remains free-text.
- Tested isolated linked expense creation/re-edit/reuse, candidate exclusion and ordering, inline details, and JS syntax. Actual browser and multi-account end-to-end test is still required. Original independent Shanghai V14 website not modified.

## V2.8 — Destination, dates, itinerary cards and transfer legs (2026-11-11)

Revises the MOA interface inspired by the user's *separate, unchanged* Shanghai V14 planner:

- Removed the redundant "로그인 후 클라우드에 여행 저장" explanation on the homepage. Account data-management functions remain collapsed and functional. Normal private trip detail no longer shows technical cloud/local-storage status; shared trip shows a simple editor/save status.
- New/edit trip destination uses a **canonical regional selector** with country optgroups (e.g. "상해", "상하이" -> "중국 상하이"); "다른 여행지 직접 입력" remains available. Existing destinations are not silently rewritten until explicitly edited.
- Trip creation dates accept typed eight digits `YYYYMMDD`, automatically formatting into `YYYY-MM-DD`. A native date-picker control is also available; both real calendar validity and 120-day trip constraints are checked.
- Day tabs show **month/day + weekday** and an optional 1-line **date-specific theme**, without stop counts. A per-day edit button persists `dayThemes[YYYY-MM-DD]`. Older trips without theme display "DAY N"; previously imported Shanghai V14 trips get an **inferred display-only theme** from their known itinerary dates until edited. The enhanced Shanghai JSON import includes explicit saved themes.
- Replaced schedule entry list with **compact itinerary cards**: confirmed stops use ordered number badges; alternative stops use a **후보** badge and a distinct indented card, never counted. Planning mode supports reordering, editing, detail disclosure; travel mode hides all candidates and emphasizes completed check/address.
- Added **travel legs between confirmed entries**, with editable mode, duration in minutes, optional local-currency cost and note; travel information is stored per destination stop as `leg` so old unannotated entries remain valid and can be edited without migration. The standalone Shanghai source had one planned Shincheonji taxi/Didi 20-minute transfer; the refreshed download contains it.
- Existing drag-and-drop event selectors were updated to recognize new card classes. Shared transactions still persist fields in stop records and top-level day themes without Firestore rules/schema changes.
- Removed outdated "next version" / "demo" wording from public-facing copy.

Tests conducted: JS syntax parse, normalized destination alias ("상해" -> "중국 상하이"), typed date formatting and leap-date validation, source Shanghai day-theme fallback, planned candidate vs travel-mode filtering, inter-stop mobility display/edit actions. Full real-device test (iPhone Safari and live two-account collaboration) remains outstanding.

**Important:** The refreshed JSON is intended for **first import only**. Importing it a second time will create a duplicate trip because MOA import is append-only; existing users should use V2.8's new editing controls rather than re-importing.

## V2.7 — Shanghai data migration and destination language cheat sheets (2026-11-11)

- Added a seventh planner tab **🗣️ 현지어** with destination-based guide switching for Chinese, Japanese, Thai, Vietnamese, French and English. Chinese expressions are drawn from the user's earlier independent Shanghai V14 planner (basic, dining, transport, shopping and sightseeing); each guide offers category filters, clipboard copy, and native device TTS when available. Unsupported destinations fall back to English. Pronunciation is approximate and device voice support varies.
- Updated **내 여행 → ＋ 여행 파일 가져오기** so valid MOA JSON files are **appended as new trips** with new trip IDs, instead of replacing the whole collection. Existing trips are preserved. Import requires authenticated email-verified user and continues to save in the same local/optional cloud flow. Importing a file does not directly provision the user's live Firebase account from this repository, and cross-device personal-trip syncing still requires the optional cloud connection.
- Created a standalone conversion file for the owner from their Nov 9 Shanghai planner JSON backup (downloaded privately in the chat, **not stored in this public GitHub repository**). The converted trip includes 38 remaining itinerary stops, one Demores Hotel stay, two Eastar Jet flights, three paid expenses and 12 preparation checklist items. Booked flights/hotel were moved from redundant per-day stop rows to native stays/transport to avoid duplicate itinerary cards. Hotel dates and cost data should be double-checked against actual bookings. Original source site and Firebase project were never edited.
- The source website `munggu-nyangi-shanghai.web.app` could not be fetched at development time; the conversion therefore uses the latest available personal backup dated **2026-11-09**, not a live database read. The source HTML V14 was read only as a reference for the phrase feature. Updates made on the standalone Shanghai site after that backup will not automatically be included.
- Existing per-traveler shared editing and site administrator permissions remain unchanged. No Firestore rules update needed for this release.

Validation: embedded JavaScript parsed successfully, phrase-language selection was tested for Chinese/Japanese/Thai/Vietnamese/French/English, and Shanghai import JSON was validated for structure and unique trip IDs. Final end-to-end browser upload/import and personal Firebase cloud sync require the user's authenticated session.

## V2.6 — Member-only planning, login-free itinerary sharing (2026-11-11)

- Remove misleading guest-mode UI language. Navigation `내 여행` now shows a login/sign-up gate when no verified user is signed in; do **not** display browser-cached private trip cards to signed-out visitors. Already saved personal trip data is not cleared or migrated. Trip creation and `save()` require a verified account. Direct private-trip open / import / export routes are gated.
- The sharing dialog now prioritizes `게스트에게 일정 보여주기`. It uses `guestPreviews/{previewId}` links `#guest=<randomDocId>` that can be read with **no login** and can only show sanitized snapshot fields: trip title, destination, start/end, confirmed stop name/day/time. No guest editing, copy-to-my-trips, or access to private expenses, addresses, bookings, notes. The original full-trip copy link remains under a collapsed separate **member-only** option and requires a verified account; collaborative editing still requires account invite and appropriate role.
- The guest snapshot must be intentionally published/updated by an authenticated trip owner, and revoked explicitly. It does **not** auto-update after later edits. Links can be forwarded and should be treated as accessible to anyone holding the link.
- **Important:** `firestore.rules` already contains a `guestPreviews` rule allowing single-document `get` anonymously, denying `list`, and allowing writes only by verified owners. Those rules **must actually be published in the Firebase Console**, because changing rules in GitHub alone never deploys them. See https://console.firebase.google.com/project/moa-travel-1b87d/firestore/rules . Keep the complete current rules to preserve the existing collaborations, private documents and admin role security.
- Tests performed: embedded JavaScript syntax, guard and link presence, simulated guest snapshot filtering for reservation/expense/address/private note leakage. Live anonymous-client Firestore permission test remains to be performed after rules deployment. For final validation, publish a fresh guest link and open it in a signed-out incognito window; check only the limited itinerary appears.
- Limitation: private personal trips remain browser-cached while logged out (hidden behind authentication UI), and previous data remains in localStorage. This is **not** a server-enforced isolation of browser localStorage across multiple accounts on a shared device. Avoid shared/public-device use until account-scoped storage or cloud-only storage is implemented. Anonymous access to private Firestore docs remains denied by rules.

## V2.5 — Simplified account UI and optional mapping (2026-11-11)

- Reworked the signed-in **내 계정** modal to lead with avatar, name, email, verification status, and logout. Removed the visible storage-mode text from the primary profile panel and the prominent cloud upload/download buttons and technical JSON backup instructions.
- Preserved **☁️ 클라우드 여행 불러오기** / **현재 여행 업로드**, their original button IDs and event handlers, storage-mode status and backup warning inside a collapsed **데이터 관리** section. This is UI simplification only: **private-trip localStorage / optional Firebase cloud synchronization behavior remains unchanged**. It is not correct to imply automatic cloud storage for someone who has not enabled it. Existing administrator entry remains available only after validated admin access.
- Place geosearch is explicitly marked **지도 위치 연결 (시험 기능)** and collapsed within the stop editor. Removed noisy geocoding shortcuts from every itinerary card.
- Day's stop order remains a compact horizontally swipeable timeline. The Leaflet map is collapsed in an optional **지도 미리보기 (시험 기능)** section; map instance initialization is delayed until the section is opened to avoid zero-size rendering. Location metadata and search implementation are retained, not deleted, for future improvement.
- No Firebase rules or stored trip schema changes. JavaScript syntax validation and static expected-controls checks passed. Browser visual testing and opt-in map behavior require device verification.

## V2.4 — Mobile-first place search & itinerary mapping (2026-11-11)

- Improved the existing place edit/add form with a mobile-friendly search field. Search runs **only on button click or Enter**, not as-you-type (to respect public geocoding service request limits). The query includes the trip destination for context. Results are more readable with place names and full addresses; choosing a result fills the editable address and attaches numerical latitude/longitude. Saving preserves location coordinates if the address is unchanged; changing the selected address intentionally clears mismatched coordinates.
- Added **📍 지도 위치 연결** shortcut to itinerary stop cards that lack coordinates (including ones with a manually entered address). It opens the existing stop editor and focuses geolocation search.
- Added previous/next day buttons beside day/date chip; disabled at itinerary boundaries. Original date tabs and order editing remain.
- Changed ordered route pills into horizontally swipeable single-line timeline on mobile; reinforced route link label and more concise map explanation. Existing OpenStreetMap Leaflet pin map and Google Maps route opening remain available. Map pins remain limited to geocoded stops/stays/transport with known coordinates; a real driving route is **not** inferred from the Leaflet straight line.
- No modifications to existing saved trip schema, Firebase or Firestore rules. Selected coordinates remain in the same `stops[]` objects and continue to sync for shared trips via V1.9 patches.
- JavaScript syntax passed and all six planner tab detail render smoke tests completed. Live map/search end-to-end on iPhone and two-account shared syncing not yet verified. Public OpenStreetMap Nominatim availability/rate limits may impact searches; existing optional Geoapify API key support remains. For best results, use a city name alongside a place name and choose the exact returned candidate.

## V2.2.1 — Invited-trip list and account UX fixes (2026-11-11)

- Removed the Firebase UID display/copy widget from the signed-in account modal (role lookup continues internally using authenticated UID).
- The My Trips dashboard includes *invited shared-trip index entries* in all/planned/completed counters, de-duplicated against an existing personal trip linked by `collabId` or `sourceTripId`. Invited trips without known completion status count as planning.
- Invited-only cards now have a **목록에서 제거** action that deletes only `users/{signedInUid}/collaborations/{tripId}`, an index owned by the current user. It never deletes `collabTrips/{tripId}`, member documents, the original owner's trip, or another person's account data. The signed-in user can still technically retain membership; the action is a **hide/remove from my list**, not a full collaboration leave or destruction. Trip-owning linked cards are not eligible. Confirm and select the specific stale card.
- Existing Firebase security rules already restrict collaboration index writes to the owning authenticated user. No Firestore rules change required for this release.
- Isolated dashboard smoke tests checked mixed personal + invited records, statuses and duplicate links, and JavaScript syntax passed. Real Firebase live testing on the user's account remains to be done.

## MOA V2.2 — Site administrator center (2026-11-11)

Admin foundation has been committed to `index.html` and `firestore.rules`. **Not yet activated for any user** until the actual owner's UID is provisioned using Firebase Console and the updated rules are published. Do not infer the owner's UID from their email, nickname, GitHub account or this README.

### One-time owner activation (manual Firebase Console action)
1. In the MOA website, sign in to the **existing owner account** (not the test account) and open **계정/저장**. Copy the displayed **내 Firebase UID**. Firebase Auth UID is a user identifier, not a password; use only the owner account's UID.
2. Open [MOA Firestore Rules](https://console.firebase.google.com/project/moa-travel-1b87d/firestore/rules), replace the complete rules contents with the current repo `firestore.rules`, and click **Publish**. Preserve all existing travel/share/collaboration rule sections.
3. Open [MOA Firestore Data](https://console.firebase.google.com/project/moa-travel-1b87d/firestore/data) and create a **root collection** `admins`. Add a document whose **document ID equals the owner's exact Firebase UID**. Add these exact fields: `role` (string) = `superadmin`; `enabled` (boolean) = `true`. Do not create a document for the test account. Firestore Console administrative writes bypass normal client security rules.
4. Sign out/in or reload the MOA site. Open **계정/저장** again and click **🛡️ 관리자 센터 열기**. If the menu doesn't appear, verify the UID, boolean type, and Rules publication.
5. Verify in a second browser signed into the **test account** that it cannot read the owner-admin document, create an admin document, or access the dashboard. The UI button should not appear for that account.

### Security and scope
- All admin privileges derive from Firestore `admins/{uid}` with exact fields `role='superadmin'` and `enabled=true`. A client can `get` only its own admin-role document; browser writes and collection listing are denied.
- The administrator dashboard is available only after authentication and a Firestore role read and currently shows own-account diagnostics plus **correctly labeled** placeholders for site-wide member/trip/collaboration counts. It does **not** browse or expose users' private itinerary/expense documents.
- `adminMetrics/overview` can be read by verified, authorized administrators, but only backend / Firebase Console can write it. No backend aggregate generator has been deployed, so overall counts are **집계 전** until explicitly provisioned. Do not interpret local personal trip counts as global data.
- An administrator is not automatically granted Firebase Authentication account listing, user removal, or private trip access. Those require audited backend actions and deliberate permissions. No such controls are implemented yet.
- The previous V2.1 expense and collaboration schemas remain unchanged.

Validation performed: JavaScript syntax parsed for all inline scripts; admin role predicate passed isolated true/false tests. Actual Firebase role, rule deployment and browser access control must still be tested with owner and test accounts.

## V2.1 collaboration sync patch (2026-11-11)

A user reported that an expense entered in one browser did not appear in the other account. This is not yet independently reproduced. The realtime shared state listener previously dropped snapshots received while a local write was busy/dirty without scheduling reconciliation. The new `sharedRefreshNeeded` flag and `refreshSharedFromServer` read reconcile the canonical Firebase state after a successful local save. The trip header now explicitly distinguishes `개인 여행` and `공동 여행`; the shared-trip action menu offers a manual server refresh to aid diagnosing stale screens. Member list refresh no longer re-renders while typing in the quick expense form. Firebase rules are unchanged.

Verify with **the shared card labeled 함께하는 여행 on BOTH browsers**, not the original private trip. Enter an expense and wait for the cloud-save success toast, then check the other window's expense tab or use `⋯ 관리 → 공동 여행 최신 정보 확인`. If changes still fail, inspect the browser toast/errors and Firebase state document. Admin role is **not yet provisioned**; no site admin authorization exists.

## V2.1 (stage 1) — Expense currency + invited-member payer choice

Updated the existing expenses tab and detailed expense entry in `index.html`:
- The trip's default local currency can be chosen from KRW/CNY/JPY/USD/EUR/TWD/THB/VND/HKD/SGD/GBP/AUD/CAD, initially suggested from destination. Changing it changes only future input defaults, not existing expense currencies or amounts.
- Every expense now records `currency`, `amount` (in that currency), and optional `payerUid` in addition to the backward-compatible `payer` display label and existing `paid` status.
- Older expense records without `currency` remain KRW. Totals are **grouped by currency**, never summed across currencies.
- In a collaborative trip, payer is selected from the actual Firebase `collabTrips/{tripId}/members` subscription; names update when members change. In a private trip, the former free-text payer input remains.
- Quick-add and detailed edit support the same choices, including foreign currencies with up to two fractional places. The existing shared-trip Firebase state saves the new fields using the V1.9 transaction merge; Firestore rules need no change.

**Not implemented intentionally:** FX rates, KRW conversion, equal split, debt calculations, settlements. Site-wide administrator authorization and management panel are not activated as part of this expense-only release.

Checks run: embedded JavaScript syntax valid; isolated tests passed for KRW legacy compatibility, inferred CNY/JPY, decimal validation, per-currency totals, currency dropdown options. Real two-account payer selection and mobile layout still require user test.

## V2.0 — Compact responsive trip-detail layout (2026-11-11)

**UI-only release: no Firebase schema or Firestore-rule changes.** Existing V1.9 collaboration, trip creation/editing, itinerary mapping and ordering, stay/transport, expenses, shopping, checklist, JSON backup and share links are preserved.

Changes:
- Rebuilt the trip detail page as a **single-column workspace**, removing the oversized right-hand sidebar and redundant mascot/overview sections.
- Condensed header with trip name, dates, destination, shared/cloud-save status, quick itinerary counts, and a prominent **👥 여행자 추가** button.
- Moved rarely used controls (trip edit, done/planning status, public snapshot/share link, backup, delete, member controls) into a small **⋯ 관리** menu. Primary 6 planner tabs remain available.
- Mobile breakpoints use **two rows of three planner tabs**, full-width plan/travel mode toggle, compact schedule cards, a smaller route-map panel and two-column quick expense entry.
- On narrow screens, expense and shopping tables render as **stacked labeled item cards**, with existing interactive checkbox/edit/delete controls preserved.
- Trip memo/details and backup/status information can be expanded as needed in accessible native `details` sections.
- No data migration needed, no localStorage key change, and no new permissions requested.

Validation: JavaScript syntax verified across all embedded inline scripts; detail rendering smoke-tested for all six planner tabs with representative local trip data; GitHub files committed. Actual cross-device visual/interaction review has not yet been performed. Recommended test: hard refresh, inspect desktop and mobile widths, check each planner tab and its edit dialogs, test traveler invite, and verify shared edits sync using the two accounts.

## V1.9 — Unified multi-user editing in the existing planner (2026-11-11)

**IMPORTANT: Update Firebase Console → Firestore Database → Rules using the latest `firestore.rules` file and click Publish. The GitHub code deploy does NOT deploy Firestore rules.** New permission for `collabTrips/{tripId}/state/current` is necessary for the shared planner.

UX:
1. Open a personal trip and choose **👥 여행자 추가**. On first use, the app creates a **shared Firebase state** from the existing private trip and an invitation link. Existing private trip data is kept as an untouched fallback/backup. The **same trip card** in the trip list now opens the unified shared planner; no separate collaboration screen is required.
2. Invitee signs into a separate, verified MOA account and follows the link. They now open the **same full trip planner**, including schedule, stay/transport, expenses, shopping and checklist, and can edit if authorized.
3. Both parties get Firestore real-time snapshots on **`collabTrips/{tripId}/state/current`**. Local changes are debounced and merged with the latest server document using Firestore transactions. Individual array items (identified by their `id`) and different object fields are patched rather than overwriting a whole array, so independent edits to different items/fields generally merge without loss. A same-field simultaneous edit is still last-write-wins. Delete-vs-edit on the same item can conflict. No operational-transform/CRDT guarantees.
4. Owner controls collaborator roles via **👥 참여자 관리**, and can create additional invites using **👥 여행자 추가**.
5. Shared planner offers save status, retry after failed saves, discard unsaved changes, and a JSON backup of the currently opened shared trip. It blocks navigation while shared edits remain unsaved.

Technical limitations:
- A *new* shared state is initialized once from the owner's existing trip. The original private copy remains as a backup and is no longer the canonical data after sharing. To edit the authoritative copy, open the linked trip card (it navigates to the shared planner).
- All shared travel info is currently in one Firestore document, subject to Firestore's document size limit (1 MiB). A larger multi-document redesign is needed for sizable production trips.
- Invitation links can be forwarded; memberships have no time-based expiration. No audit history or conflict-free simultaneous same-field editing. Do not share sensitive booking reference numbers or personal details during prototype testing.
- Existing pre-V1.9 collaborative workspaces with no state/current may be migrated by their owner using the associated private trip, but historic edits made *only* in the legacy separate schedule may not be migrated automatically. Back up before testing migration.
- User-specific private localStorage remains separate from Firebase and isn't yet wiped on logout on shared browsers.

Validation: JavaScript parses successfully; the item/field merge helper passed isolated tests for edits to separate fields and collections. **The new Firestore security rules and end-to-end 2-account editing still require live testing in the user's Firebase project.**

## V1.8 UX simplification — Add traveler (2026-11-11)

The separate **공동 여행** section has been removed from the dashboard. Open a personal trip and select **👥 여행자 추가**. On first use, this provisions a separate collaborative schedule backing store and opens an invitation prompt; on later use, it opens the associated collaborative schedule and produces an invitation link. Existing private trip details (stays, expenses, shopping, transport, etc.) remain available through the **original travel card and detail view**, and a **🤝 공동 일정 열기** button provides access to the separately synced schedule. A recipient's shared schedule appears as a single travel card under **내 여행**, not as a second section.

**Important functional limitation:** this UX simplifies navigation but still does not turn the existing private trip into a fully shared trip. The collaborative stops are a separate copy and edits there do not sync back to the private trip timeline. Only collaborative stops sync live between members. Do not assume bookings, expenses, shopping and checklist are shared. Full integration and account-scoped unified travel storage remain future work.

Existing V1.8 Firestore rules must be published before using Add traveler, exactly as documented below.

## V1.8 — collaborative schedule MVP (2026-11-11)

**Requires manually publishing the latest `firestore.rules` in Firebase > Firestore Database > Rules.** GitHub commits do not deploy Firestore rules.

Existing personal trips and V1.7 snapshot links are unchanged. An authenticated, email-verified member can open a **personal trip** and click **🤝 공동 편집 시작** to create a **separate** collaborative workspace. The initial title/destination/dates and up to 200 standard schedule stops are copied, without overwriting their private trip or its cloud backups. Users see collaborative workspaces in **내 여행 → 공동 여행**. Only stop names, day, time, address, and notes are collaboratively editable in this milestone; hotels, transportation bookings, expenses, shopping, checklist, stop ordering and personal trip status remain separate and unshared.

The workspace owner can create a new unlisted invitation at **🔗 공동 편집 초대**. A logged-in, email-verified invitee can follow the invite URL and join as **editor**. Firestore security rules verify the invitation document ID on member creation. Authorized members subscribe in real time to individual `collabTrips/{tripId}/stops/{stopId}` documents. Editing *different stops* avoids clobbering a whole trip array; editing the *same stop simultaneously* is still last-write-wins. Owner may change a member to **viewer** or remove them; changes are checked by rules and subscriber updates. The owner cannot transfer ownership through this UI.

Firestore paths:
- `collabTrips/{tripId}` — owner and trip metadata
- `collabTrips/{tripId}/members/{uid}` — verified invitation memberships and roles
- `collabTrips/{tripId}/stops/{stopId}` — individual, real-time stop documents
- `collabInvites/{token}` — unlisted invitation credentials; may be forwarded
- `users/{uid}/collaborations/{tripId}` — per-user workspace index

**Caution:** Invitation URLs do not expire and may be forwarded. No recipient-specific whitelist, invite revocation UI, audit trail, full-trip synchronization, concurrency resolution on a single stop, or production-grade privacy/legal features. Workspace deletion and self-leaving aren't implemented. Test with non-sensitive sample trips. A removed user's list index may remain and open attempts will be denied by security rules.

Verification checklist: after posting rules, create a test workspace from a test trip; generate invite; in an incognito window sign in with a **different** verified MOA account; accept invitation; add a stop there; observe owner window updating; remove editor rights and verify writes are denied; then reenable editor rights.

## V1.7 — Trip invitation links (2026-11-11)

A logged-in, email-verified member who has enabled cloud saving can open a trip and use **여행 공유**. This publishes an unlisted snapshot in `tripShares/{randomFirestoreID}`, copies a deep-link of the form `/#share=TOKEN` under MOA's existing GitHub Pages path, and lets a signed-in verified recipient **copy** the shared trip into their own local trip list. The owner can refresh a snapshot or revoke its link. Copied trips have new trip IDs and do not share their original edit state.

**Important: Publish updated `firestore.rules` in the Firebase console manually** to enable the new collection. GitHub deployment does not deploy Firestore security rules.

**Privacy limitations:** The snapshot includes the **entire trip object** (including expense, notes, booking data); anybody with the link *and a verified MOA account* can read it. There is no single-invitee restriction, recipient approval list, access notification, automatic expiration, or live collaboration. Links may be forwarded. Revocation prevents new reads but cannot retract already copied data. Do not share trips containing private booking numbers or other sensitive data. Prefer testing with dummy trips.

**Known prototype limitations:** Shared snapshot content is not automatically refreshed after source edits; the owner must click to refresh. Saved browser data is not automatically isolated by signed-in account, and multi-device edits could conflict. A dedicated owner/member role and separate collaborative trip record are needed before enabling live co-editing.

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
