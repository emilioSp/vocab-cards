---
name: feedback-code-style
description: "Code style preferences for this project — TypeScript, async patterns, component structure, hooks, API separation"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9c5e28cf-3065-4b03-9f52-5f0fef3c82d8
---

Use `type` not `interface` for all TypeScript type definitions.

**Why:** User explicitly requested this convention.

**How to apply:** Every type definition in `src/types/` and elsewhere uses `type Foo = { ... }`, never `interface Foo { ... }`.

---

One `.tsx` file per component.

**Why:** Maintainability — user wants easy navigation to individual components.

**How to apply:** Never put multiple exported components in one file. Each component gets its own file in `src/components/`.

---

Custom hooks pattern — logic lives in hooks, components are pure UI.

**Why:** Separation of concerns. Hooks in `src/hooks/`, components in `src/components/`.

**How to apply:** No business logic, FS calls, or API calls inside component files. Extract to a hook.

---

Tailwind CSS first, custom CSS only as last resort.

**Why:** User preference for consistency and maintainability.

**How to apply:** Reach for Tailwind utilities before writing any raw CSS. Only use `index.css` for things Tailwind genuinely can't express (e.g. 3D transform helpers, `@font-face`).

---

Keep logic in JS/TS, avoid Rust when possible (user doesn't know Rust).

**Why:** User explicitly said "stick with JS whenever possible, simpler for me to understand."

**How to apply:** Use `tauri-plugin-fs` JS API instead of custom Rust commands. Only touch `lib.rs` to register plugins.

---

Prefer async/await over `.then()` chains in hooks.

**Why:** User left a code comment in `useCards.ts` asking to replace `.then()` with async/await. It's cleaner and easier to read.

**How to apply:** In hooks and storage functions, use `async/await` with try/catch. Avoid chained `.then().catch().finally()` patterns. When an async side-effect runs inside a `useEffect`, use an IIFE with a `cancelled` flag to handle cleanup.

---

Each external API source gets its own file in `src/api/`.

**Why:** User left a comment in `tatoeba.ts` requesting the Free Dictionary fallback be moved to its own file (`free-dictionary.ts`). One concern per file.

**How to apply:** `openverse.ts`, `tatoeba.ts`, `freeDictionary.ts` are separate. If a new external data source is added, it gets its own file — never bundle two different APIs into one module.
