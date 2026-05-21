# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run the app (always use this, not npm run dev)
npm run tauri dev

# Type-check only
npx tsc --noEmit

# Production build (frontend only)
npm run build
```

There are no tests. There is no linter configured.

`npm run dev` starts Vite only (no native APIs). Always use `npm run tauri dev` to develop — it starts both Vite and the native macOS window with filesystem access.

The first `npm run tauri dev` compiles ~350 Rust crates and takes several minutes. Subsequent runs are fast. Capabilities changes (`src-tauri/capabilities/`) require a Rust recompile.

## Architecture

**Tauri v2 macOS app** — React 19 + TypeScript + Vite frontend, Rust backend. All filesystem access goes through `tauri-plugin-fs` JS API; there are no custom Rust commands.

### Filesystem storage layout

All data lives under `appDataDir()` (macOS: `~/Library/Application Support/com.emiliosp.vocab-cards/`):

```
decks/
  {deck-slug}/
    .config.json        ← { name, coverColor, icon }
    {word-slug}.json    ← { word, translation, sampleSentence, imgBase64, score }
```

Names/words are **slugified** (`src/storage/slugify.ts`) before becoming folder/file names. Every CRUD operation is a direct filesystem operation — no database, no localStorage.

**Rename edge case:** changing a deck name or card word requires renaming the folder/file. The storage layer throws if the new slug already exists (collision detection).

### Layer responsibilities

| Layer | Location | Responsibility |
|---|---|---|
| **storage/** | `src/storage/` | Raw FS operations (`tauri-plugin-fs`). `paths.ts` builds all paths. `slugify.ts` normalises names. |
| **hooks/** | `src/hooks/` | Business logic + React state. Wraps storage, surfaces `error`/`loading` state. |
| **components/** | `src/components/` | Pure UI — no FS calls, no API calls. One file per component. |
| **api/** | `src/api/` | External HTTP (Openverse images, Tatoeba sentences, Free Dictionary fallback). |
| **types/** | `src/types/index.ts` | Shared types. `Deck`/`Card` are in-memory shapes with derived `id`. `DeckConfig`/`CardData` are on-disk shapes without `id`. |

### Navigation

No React Router. `App.tsx` owns all navigation state:
- `mode: 'manage' | 'learn'`
- `view: { screen: 'home' } | { screen: 'deck-detail'; deckId: string }`

Modals (`DeckEditor`, `CardEditor`, `Confirm`) are rendered as overlays from `App.tsx` when their state is non-null.

### Virtual decks

`DeckPicker` exposes two virtual decks (`__all__`, `__random__`) with hardcoded IDs. `App.tsx` detects these and loads all cards from all real decks via `Promise.all(decks.map(d => listCards(d.id)))`.

### Learn session

`useLearnSession` (`src/hooks/useLearnSession.ts`) owns all learn-mode state. Cards are weighted-shuffled on init (lower score → higher probability of appearing early). Scoring calls `updateCard` directly on the storage layer to persist to disk immediately. Keyboard bindings (Space/Enter = flip, ↑↓ = score, ←→ = back/skip) are registered inside the hook.

## Code conventions

- **TypeScript:** use `type`, never `interface`.
- **Async:** use `async/await` with try/catch, not `.then()` chains.
- **API files:** one external data source per file in `src/api/`.
- **No Rust changes needed** for new features — stay in JS/TS.

## FS permissions

`src-tauri/capabilities/default.json` — each command has three `allow` path patterns because Tauri's glob treats `**` (directories), `**/*` (regular files), and `**/.*` (dotfiles like `.config.json`) separately. All patterns are scoped to `$APPDATA`.

## Design tokens

Tailwind config (`tailwind.config.js`) has the full token set. Key values:
- Accent: `#e07a5f` (hardcoded, no CSS variable)
- Fonts: Bricolage Grotesque (`font-display`), Plus Jakarta Sans (`font-sans`), JetBrains Mono (`font-mono`) — all bundled in `src/assets/fonts/`, no CDN
- Custom CSS classes in `src/index.css`: `.perspective-card`, `.preserve-3d`, `.backface-hidden`, `.rotate-y-180` (3D flip), `.bg-stripes`, `.sentence-hl`
