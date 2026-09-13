# Prompt Stash

A personal prompt library, built on the existing Next.js 16.3.5 / React 19 / TypeScript / Tailwind CSS 4 project.

## Backend modes

The app resolves its data backend from runtime environment variables, so a single build serves either mode:

- **Local mode (default, zero setup).** No backend env set. The UI persists to browser `localStorage` and the HTTP API stays dormant (`503`). A fresh clone runs immediately with seeded demo data.
- **Remote mode.** Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `PROMPT_STASH_OWNER_ID` (a UUID). The UI calls same-origin `/api/prompts`, which reads and writes Supabase on the server using the service-role key. The browser never sees the key. Run `supabase/migrations/001_prompts.sql` first.
- **Server file store (optional).** Set `ENABLE_SERVER_API=true` (no Supabase) to exercise the same API path against `.data/prompts.json`. Useful before you have Supabase credentials.

Mode is decided in `lib/runtime.ts` and read by both `proxy.ts` (which gates the API) and the root layout (which selects the client store). The layout is `force-dynamic`, so switching env and restarting flips modes without rebuilding.

The organize switch runs a small, deterministic local keyword classifier — no external AI in either mode unless `AI_API_KEY` is set, and even then failures fall back to safe metadata without altering content.

The interface uses a line-drawing / terminal blueprint aesthetic: engineering grid paper, IBM Plex Mono, hairline black cards, and a single bright teal accent. Existing routes and dialog primitives are preserved.

## Run

Requires Node.js 20.9+; Node.js 24 is recommended.

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. No environment variables or API keys are required for local mode.

Use the same origin consistently: `localhost:3000` and `127.0.0.1:3000` have separate browser storage.

## Core Flow

Add Prompt -> Inbox -> Search / Filter -> Copy -> Detail -> Edit -> Move to Library

- Capture opens a modal with content, optional title, optional source URL, and an organize switch.
- Saving immediately inserts the prompt at the top of Inbox, closes the modal, and shows `Prompt saved`.
- The organize switch runs a small, deterministic local keyword classifier. It generates title, description, category, tags, and type without changing the original content.
- When organization is off, metadata stays empty/default. A supplied title wins; otherwise the first 30 characters become a temporary title.
- Inbox contains only `inbox`. Library contains `library` and `tested`. Archived prompts have a separate sidebar destination.
- Search matches title, description, full content, and tags. It combines with category, type, and Library status filters.
- Cards and detail pages support copy, edit, Move to Library, Mark as Tested, Archive, and confirmed Delete.
- Detail keeps the full text prominent and metadata secondary.
- Cmd/Ctrl+K focuses search. Cmd/Ctrl+N opens capture. Escape closes a modal.
- Focus trapping/restoration, keyboard menus, error feedback, empty states, reduced motion, and mobile navigation are included.

## Data

`data/mock-prompts.ts` contains 12 realistic editable examples:

- 8 Inbox, 2 Library, 2 Tested.
- Design, Research, Coding, Writing, Image, and Productivity.
- Prompt, Template, and Skill.

Browser storage key: `prompt-stash.frontend.v1`.

The collection is seeded only when that key is missing. Changes persist across refreshes and server restarts and synchronize between tabs on the same origin. An empty collection stays empty. Invalid stored data is reported, not overwritten.

Data remains in this browser profile. Clearing site data removes these local changes. Browser storage is not encrypted and is not a substitute for a backed-up database. The previous `.data/prompts.json` file is untouched and is not automatically imported.

## Active Structure

```text
app/                          Existing pages and routing
components/app-shell.tsx      Layout, mobile navigation, shortcuts
components/sidebar.tsx        Inbox, Library, types, Archived
components/search-bar.tsx     Shared search field
components/filter-bar.tsx     Composable collection filters
components/prompt-list.tsx    Shared list and loading skeleton
components/prompt-card.tsx    Content previews and copy feedback
components/prompt-dialog.tsx Add/edit modal and local validation
components/prompt-detail.tsx Full content and metadata
components/delete-dialog.tsx Delete confirmation
components/empty-state.tsx   Empty and search-no-result states
components/toast.tsx         Shared toast presentation
components/workspace-provider.tsx  UI state and mock service bridge
data/mock-prompts.ts          First-run examples
services/mock-prompts.ts      Browser store and CRUD
services/mock-organizer.ts    Local metadata simulation
types/prompt.ts               Shared prompt contracts
lib/validation.ts            Shared input validation
```

The data layer has two seams that share the same async CRUD shape, so the UI never changes between modes:

- `services/mock-prompts.ts` — the browser `localStorage` store (local mode).
- `services/api-prompts.ts` — the same reactive surface backed by `fetch('/api/prompts')` (remote mode).
- `services/prompt-store.ts` — selects the store from the runtime mode.
- `services/prompts.ts` — the server-side data access used by the API routes; already speaks both Supabase and the on-disk file store, so the next backend change is centered here.

`proxy.ts` returns `503` for API requests in local mode, and enforces workspace auth / API-key / same-origin rules in remote mode before any handler runs.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

The active Playwright suite is `tests/e2e/frontend*.spec.ts`. It starts a production build on port 3100 and uses isolated browser contexts, so it does not modify the preview's data.

18 checks cover the full product flow, exact clipboard text, local organization on/off, search/filter combinations, editing all fields, menu actions, focus management, retained drafts, invalid storage, cross-tab updates, dormant APIs, deep links, and desktop/tablet/mobile layouts from 320 to 1440px. Network assertions verify that the core workflow makes no backend or external requests.

Screenshots and failure artifacts are in `test-results/`; the HTML report is in `playwright-report/`.
