---
name: project-vocabcards
description: "VocabCards project — tech stack, architecture, folder structure, and what's been built"
metadata: 
  node_type: memory
  type: project
  originSessionId: 9c5e28cf-3065-4b03-9f52-5f0fef3c82d8
---

VocabCards is a Tauri v2 macOS flashcard app (English → Italian vocabulary). Migrated from a Claude Design browser prototype.

**Tech stack:** Tauri v2 + React 19 + TypeScript + Vite + Tailwind CSS 3. Fonts bundled locally (no CDN). No React Router — state-based navigation.

**FS storage:** `tauri-plugin-fs` (JS-side only, no custom Rust commands). Structure:
- `$APPDATA/decks/{slug}/.config.json` → `{ name, coverColor, icon }`
- `$APPDATA/decks/{slug}/{word-slug}.json` → `{ word, translation, sampleSentence, imgBase64, score }`
- Filenames and folder names are slugified (lowercase, spaces→hyphens, strip special chars)
- Rename word or deck name = rename file/folder (collision check → throw error with user-visible message)

**Design tokens:** accent `#e07a5f` (hardcoded in Tailwind config, no CSS variable). Cream/ink/good/bad color palette. Bricolage Grotesque (display), Plus Jakarta Sans (sans), JetBrains Mono (mono). All fonts bundled in `src/assets/fonts/` as woff2, declared via `@font-face` in `src/index.css`.

**What was removed from prototype:** TweaksPanel, shuffle toggle (always shuffles weighted by score), showSentence toggle (always shown), accent color picker, density toggle.

**Implemented folder structure:**
```
src/
  App.tsx                    # root: navigation state, all CRUD wiring
  main.tsx                   # entry point, imports index.css
  index.css                  # @font-face + Tailwind + global CSS
  types/index.ts             # Deck, Card, DeckConfig, CardData
  storage/
    slugify.ts
    paths.ts                 # $APPDATA path helpers
    deckStorage.ts           # list/create/update/rename/delete decks
    cardStorage.ts           # list/create/update/delete cards
  hooks/
    useDecks.ts
    useCards.ts
    useLearnSession.ts       # weighted shuffle, keyboard handler, score persists to disk
  api/
    openverse.ts             # image search (Creative Commons)
    tatoeba.ts               # sentence search (eng→ita), calls freeDictionary fallback
    freeDictionary.ts        # fallback sentence search
  components/
    Icon.tsx, TopBar.tsx, EmptyState.tsx
    DeckGrid.tsx, DeckCard.tsx, DeckDetail.tsx, CardTile.tsx
    DeckEditor.tsx, EmojiPicker.tsx
    CardEditor.tsx, ImageSearchPanel.tsx, SentenceSearchPanel.tsx
    FlashCard.tsx, DeckPicker.tsx, LearnView.tsx, SessionComplete.tsx
    Confirm.tsx
  assets/
    emojis.ts                # ~1000 labeled emoji entries (converted from prototype JS)
    fonts/                   # 13 woff2 files (Bricolage, Plus Jakarta, JetBrains Mono)
src-tauri/
  src/lib.rs                 # registers tauri_plugin_opener + tauri_plugin_fs
  capabilities/default.json  # FS permissions scoped to $APPDATA/**
  Cargo.toml                 # tauri-plugin-fs = "2" added
```

**Virtual decks (learn mode):** `__all__` (all cards) and `__random__` (all cards, always shuffled). Defined in `DeckPicker.tsx` as `VIRTUAL_DECKS`, imported by `App.tsx`.

**Known limitation:** DeckGrid shows card count = 0 for all decks except the currently open deck-detail. Counts only update when a deck is opened. Not a bug per se — loading all cards on startup would be expensive.

**Why:** Clean production app replacing browser prototype that used CDN React, Babel runtime, and localStorage.

**How to apply:** Use this context for architectural decisions, adding features, or modifying storage.
