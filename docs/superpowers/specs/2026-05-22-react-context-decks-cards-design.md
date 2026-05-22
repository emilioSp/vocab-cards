# React Context for Decks and Cards

**Date:** 2026-05-22
**Status:** Approved

## Context

`useDecks` and `useCards` use `useState` internally, so every call creates an independent state instance. Any component that called them would get its own isolated copy — mutations in one wouldn't propagate to others. This forced App.tsx to be the single call site and prop-drill mutations and data to every view.

The goal is to lift both hooks into React Context so shared state is guaranteed. Any component can call `useDecks()` or `useCards(deckId)` directly, with no prop drilling at all.

## Architecture

```
src/context/DecksContext.tsx   → DecksProvider + useDecks()
src/context/CardsContext.tsx   → CardsProvider + useCards(deckId)

App.tsx
  <DecksProvider>
    <CardsProvider>
      <AppShell />    ← routing only, no state ownership
    </CardsProvider>
  </DecksProvider>

src/hooks/useDecks.ts  → one-line re-export (keeps all import paths valid)
src/hooks/useCards.ts  → one-line re-export
```

## DecksContext

Move the full body of `useDecks.ts` (useState, useEffect, all mutation functions) into `DecksProvider`. `useDecks()` becomes a `useContext` call that throws if used outside the provider.

```tsx
// src/context/DecksContext.tsx
const DecksContext = createContext<UseDecksResult | null>(null);

export function DecksProvider({ children }: { children: React.ReactNode }) {
  // all state + effects + mutations from current useDecks.ts
}

export function useDecks(): UseDecksResult {
  const ctx = useContext(DecksContext);
  if (!ctx) throw new Error('useDecks used outside DecksProvider');
  return ctx;
}
```

```ts
// src/hooks/useDecks.ts  (replaces current content)
export { useDecks } from '../context/DecksContext';
```

## CardsContext

Same pattern. No cache — fresh load per deckId change is acceptable. Provider holds one deck's card state at a time; reloads when the active deckId changes.

```tsx
// src/context/CardsContext.tsx
type CardsContextValue = {
  cards: Card[]
  loading: boolean
  error: string | null
  clearError: () => void
  setActiveDeck: (deckId: string) => void
  createCard: (data: Omit<CardData, 'score'>) => Promise<Card | null>
  updateCard: (cardId: string, data: Partial<CardData>) => Promise<Card | null>
  deleteCard: (cardId: string) => Promise<void>
}

export function CardsProvider({ children }: { children: React.ReactNode }) {
  const [activeDeckId, setActiveDeck] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // useEffect: reload cards when activeDeckId changes (same logic as current useCards.ts)
  // createCard / updateCard / deleteCard: same as current, scoped to activeDeckId
}

export function useCards(deckId: string) {
  const ctx = useContext(CardsContext);
  if (!ctx) throw new Error('useCards used outside CardsProvider');
  useEffect(() => { if (deckId) ctx.setActiveDeck(deckId); }, [deckId]);
  return {
    cards: ctx.cards,
    loading: ctx.loading,
    error: ctx.error,
    clearError: ctx.clearError,
    createCard: ctx.createCard,
    updateCard: ctx.updateCard,
    deleteCard: ctx.deleteCard,
  };
}
```

```ts
// src/hooks/useCards.ts  (replaces current content)
export { useCards } from '../context/CardsContext';
```

## useViewManager

Drops its `decks` parameter — calls `useDecks()` internally.

```ts
// Before: export function useViewManager(decks: Deck[])
// After:  export function useViewManager()
export function useViewManager() {
  const { decks } = useDecks();
  // rest unchanged
}
```

## Component prop simplifications

| Component | Props removed | Props kept |
|---|---|---|
| `TopBar` | `decks`, `canLearn` | `mode`, `onModeChange` |
| `DeckGridView` | `decks`, `createDeck`, `updateDeck`, `deleteDeck` | `onOpenDeck` |
| `DeckDetailView` | `allDeckNames`, `updateDeck`, `deleteDeck`, `adjustCardCount` | `deck`, `onBack`, `onStartLearn` |
| `EmptyStateView` | `createDeck` | *(none)* |
| `LearnView` | `allDecks` | `deck`, `onPickDeck`, `onExit` |

Each component calls `useDecks()` or `useCards(deckId)` directly to access what it needs.

## AppShell (inner App)

```tsx
function AppShell() {
  const { decks, loading, error, clearError } = useDecks();
  const { mode, view, learnDeckId, currentDeck, learnDeck,
          changeMode, setView, setLearnDeckId } = useViewManager();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-sans text-ink-300">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-ink antialiased">
      <TopBar mode={mode} onModeChange={changeMode} />
      {error && (
        <div className="bg-bad/10 border border-bad/30 text-bad-700 text-sm px-6 py-3 flex items-center justify-between">
          {error}
          <button onClick={clearError} className="text-bad-700 opacity-60 hover:opacity-100 bg-transparent border-0 cursor-pointer">✕</button>
        </div>
      )}

      {mode === 'learn' && learnDeck ? (
        <LearnView deck={learnDeck} onPickDeck={setLearnDeckId} onExit={() => changeMode('manage')} />
      ) : view.screen === 'home' ? (
        <DeckGridView onOpenDeck={id => setView({ screen: 'deck-detail', deckId: id })} />
      ) : currentDeck ? (
        <DeckDetailView
          deck={currentDeck}
          onBack={() => setView({ screen: 'home' })}
          onStartLearn={() => { setLearnDeckId(currentDeck.id); changeMode('learn'); }}
        />
      ) : null}
    </div>
  );
}

export default function App() {
  return (
    <DecksProvider>
      <CardsProvider>
        <AppShell />
      </CardsProvider>
    </DecksProvider>
  );
}
```

## Files to create / modify

**Create:**
- `src/context/DecksContext.tsx`
- `src/context/CardsContext.tsx`

**Modify:**
- `src/hooks/useDecks.ts` — replace with re-export
- `src/hooks/useCards.ts` — replace with re-export
- `src/hooks/useViewManager.ts` — remove `decks` param, call `useDecks()` internally
- `src/App.tsx` — providers + AppShell pattern
- `src/components/TopBar.tsx` — call `useDecks()`, drop `decks` + `canLearn` props
- `src/views/DeckGridView.tsx` — call `useDecks()`, drop deck mutation props
- `src/views/DeckDetailView.tsx` — call `useDecks()`, drop mutation + allDeckNames props
- `src/views/EmptyStateView.tsx` — call `useDecks()`, drop `createDeck` prop
- `src/views/LearnView.tsx` — call `useDecks()` for allDecks, drop `allDecks` prop

## Verification

1. `npx tsc --noEmit` — zero errors
2. `npm run tauri dev` and exercise every flow:
   - Empty state: create first deck → grid appears, TopBar updates
   - Grid: create / edit / delete deck → mutations reflected everywhere immediately
   - Deck detail: add / edit / delete card → card count in TopBar updates
   - Learn mode: edit card mid-session → card reflects change
   - Navigate between decks rapidly → cards reload correctly each time
