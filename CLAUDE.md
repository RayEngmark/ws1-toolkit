# WS1 Toolkit

Tauri 2 desktop app that gives a small (~10-person) IT team a fast, focused UI for the most common Workspace ONE UEM operations — tagging, moving devices between OGs, smart-group assignment, profile/app deployment — plus a Library tab that exposes every WS1 MDM V1 endpoint with a safe raw-request runner. The official WS1 console is slow and over-broad; this tool is the opposite: dense, action-first, keyboard-friendly, and always one click away from the underlying API.

The user is a Norwegian IT admin. The team owner is at tenant `as2596.awmdm.com`.

## Stack

- **Tauri 2** — Rust backend (`src-tauri/`) + WebView frontend
- **React 19 + TypeScript + Vite 7**
- **Zustand 5** for state, **CSS Modules** for styling
- **framer-motion 12** (installed; used by in-progress redesign work)
- **tauri-plugin-store** for credential persistence in the user profile
- GitHub Actions builds Windows `.msi` (the only target — macOS and Linux jobs were dropped to keep CI fast)

## Layout

```
src-tauri/src/
  api/         OAuth token cache + reqwest client + WS1 type defs
  commands/    Tauri IPC commands (one file per domain: devices, tags, og, …)
  state.rs     AppState, WS1Config (OAuth-only)
  lib.rs       Command registration

src/
  ipc/
    client.ts      Typed wrapper around invoke()
    contracts.ts   Shared TS types — must mirror Rust serde shapes
  state/
    connectionStore.ts   OAuth credentials + connection status
    selectionStore.ts    Global device selection (persists across modules)
    uiStore.ts           Active module, toasts, library cursor
  components/    AppShell, Sidebar, Toolbar, DeviceShuttle, TargetPicker,
                 StatusBar, Toast, shared/
  modules/       One folder per action page: LookupDevice, TagDevices,
                 MoveDevices, AddToSmartGroup, RemoveFromSmartGroup,
                 AssignProfile, AssignApp, CreateTag, LookupSmartGroup,
                 Settings, _shared/
  library/
    catalog.ts        Auto-generated from docs/specs/*.json by
                      build-catalog.mjs. DO NOT EDIT — rerun the script.
    catalogStore.ts   Zustand store; bundled catalog by default, swapped
                      by Settings → "Import API library from tenant"
    specToCatalog.ts  Swagger 2.0 / OpenAPI 3.0 → CatalogEndpoint[]
    LibraryShell.tsx  Tab UI: search, category tree, raw runner

scripts/build-catalog.mjs   Merges every spec under docs/specs/*.json
                            into catalog.ts. Run after re-fetching specs.
docs/specs/                 OpenAPI specs captured from a real tenant via
                            /api/help/Docs/<name>. Currently MDM V1-V4.
docs/ws1-mdm-v1-api-source.md     Legacy markdown reference (kept for
                                  human reading — no longer feeds catalog).
docs/ws1-mdm-v1-api-reference.md  Annotated commentary version.
```

## Conventions and aesthetic — read this before touching UI

The user has rejected several redesigns for being "AI slop" or "SaaS dashboard." The look is **VS Code dense IT-tool**, not consumer SaaS. Specific past rejections:

- ❌ Rounded indigo/purple gradient cards
- ❌ Inter / Roboto / generic system fonts
- ❌ Italic display titles, eyebrow labels, IBM Plex experiments
- ❌ Generic page-fade animations ("just animations on opening a new window")
- ❌ Oversized rounded SaaS cards with emoji
- ❌ Time estimates in responses

**Visual baseline (do not drift from this without explicit approval):**

- Dark VS Code palette via CSS vars in `src/styles/`: `--bg-0 #1e1e1e`, `--fg-0 #d4d4d4`, `--accent #0098ff` (and the rest defined there — always use the var, never inline a hex)
- Fonts: **Segoe UI** for UI, **Cascadia Mono** for data/code
- Sharp corners or 2-4px radius. No big shadows, no gradients on solids.
- Dense spacing — 24px row height typical. Mostly grid-based fields with a 120px label column (see `Settings.module.css` for the canonical example).
- Toolbar segmented controls, status bar at the bottom, sidebar on the left.

**When in doubt, mimic the existing module pages** rather than inventing new patterns.

## Production data only — no mocks, no fakes

Treat every code path as production. The WS1 tenant on the other end is the team's real fleet, and any value the app reads, commits, displays, or persists must come from a real WS1 API response — never hardcoded, fabricated, or filled in with a "reasonable default."

Concretely:

- Never hardcode an `ogId`, `tagId`, `smartGroupId`, app/profile id, etc. in an IPC call. If a value is needed and not yet loaded, render a loading state and wait.
- Don't fall back to `0`, `""`, or `null` as if it were a valid tenant value. `getTags(0)` is a bug, not a default.
- No demo modes, no mock fixtures shipped to runtime. Unit tests can stub — runtime cannot.
- If a WS1 response field is missing, surface it honestly (`—`, `not reported`, blank). Never fabricate counts, names, statuses, or members.
- On error, surface what WS1 said. Don't translate a `403 Forbidden` into "tag applied to 0 devices" or similar friendly lies — that hides real problems.

## WS1 API specifics

- **Auth: OAuth 2.0 `client_credentials` only.** Basic auth was removed — do not reintroduce it.
- Required headers on every call: `aw-tenant-code: <apiKey>`, `Authorization: Bearer <token>`, `Accept: application/json;version=2`.
- The token is cached in `AppState` and refreshed 60s before expiry — see `src-tauri/src/api/auth.rs`.
- **Omnissa rebrand:** the auth domain is no longer `*.vmwservices.com`. The user will provide the correct token URL — keep placeholders generic (e.g. `https://<region>.uemauth.<your-tenant-domain>/connect/token`).
- Device search supports `lgid={ogId}` for transitive OG inclusion.
- App assignment has no per-device endpoint — it goes through `POST /api/mam/apps/internal/{appId}/assignments` with smart-group IDs.
- Profile install/remove is per-device by `SerialNumber`, not device id.

### Library tab raw runner — safety rules (do not weaken these)

- Method allowlist: `GET / POST / PUT / PATCH / DELETE` only.
- Path must start with `/`, must not contain `://` or `\`, must not start with `/http`.
- `DELETE` and `PUT` use a 2-click "Arm → Confirm" pattern in the UI to prevent fat-finger destruction.

## Dev workflow

- **Full app:** `npm run tauri dev` — launches the Tauri shell with the Rust backend. Vite serves at `localhost:1420`; over WiFi the user reaches it at `192.168.68.105:1420`. There's no browser-only mock mode anymore — every IPC call goes to Rust.
- **Type check:** `npx tsc --noEmit` (this is what CI runs as part of `npm run build`).
- **Rust check:** `cargo check` from `src-tauri/`. There's one known-ignorable `token_type` dead-code warning.
- **Catalog rebuild:** after editing `docs/ws1-mdm-v1-api-source.md`, run `node scripts/build-catalog.mjs` to regenerate `src/library/catalog.ts`.
- **Windows builds:** push to `main` triggers GitHub Actions; the user grabs the `.msi` from the release artifacts. CI only builds Windows — macOS and Linux jobs were intentionally removed.

## Open context

- A redesign plan exists at `/home/raymond/.claude/plans/async-sniffing-swan.md` — object-first navigation (tile grid → object actions → action view) replacing the current sidebar-of-verbs layout. Animation prototypes have been attempted twice and rejected for being too generic. If you pick this up, study the plan's "what feels alive" requirements (shared-element transforms, ambient motion, parallax) before writing code.
- The bundled catalog has 498 endpoints. The "Import API library" button in Settings replaces it at runtime by fetching the tenant's Swagger spec — auto-discovery tries six URL patterns; users can override via the Spec URL field.
- Selection persists across modules via `selectionStore`. After a successful bulk action, the action page is responsible for clearing it (`selectionStore.clear()`).
