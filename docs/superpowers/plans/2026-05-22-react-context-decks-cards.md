# React Context for Decks and Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lift `useDecks` and `useCards` into React Context so any component can call them directly with shared state — no prop drilling of mutations or data.

**Architecture:** `DecksProvider` and `CardsProvider` wrap the app; the existing hook logic moves into the providers verbatim; `useDecks()` and `useCards(deckId)` become `useContext` consumers. All views call hooks directly. App.tsx becomes providers + a thin `AppShell` that only passes navigation callbacks.

**Tech Stack:** React 19, TypeScript, Tauri v2. No test runner — verification is `npx tsc --noEmit` after each task.

**Spec:** `docs/superpowers/specs/2026-05-22-react-context-decks-cards-design.md`

---

## File Map

| File | Action |
|------|--------|
| `src/context/DecksContext.tsx` | **Create** — DecksProvider + useDecks() |
| `src/context/CardsContext.tsx` | **Create** — CardsProvider + useCards(deckId) |
| `src/hooks/useDecks.ts` | **Replace** — one-line re-export |
| `src/hooks/useCards.ts` | **Replace** — one-line re-export |
| `src/hooks/useViewManager.ts` | **Modify** — remove `decks` param, call useDecks() internally |
| `src/App.tsx` | **Rewrite** — providers + AppShell split |
| `src/components/TopBar.tsx` | **Modify** — call useDecks(), drop decks/canLearn props |
| `src/views/DeckGridView.tsx` | **Modify** — call useDecks(), drop deck mutation props |
| `src/views/DeckDetailView.tsx` | **Modify** — call useDecks(), drop mutation + allDeckNames props |
| `src/views/EmptyStateView.tsx` | **Modify** — call useDecks(), no props |
| `src/views/LearnView.tsx` | **Modify** — call useDecks() for allDecks, drop allDecks prop |

---

## Task 1: Create DecksContext

**Files:**
- Create: `src/context/DecksContext.tsx`

This is a pure addition — no existing files change. The body is the exact logic from the current `src/hooks/useDecks.ts`, wrapped in a provider.

- [ ] **Step 1: Create `src/context/` directory and write DecksContext**

Create `src/context/DecksContext.tsx` with this exact content:

```tsx
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { type Deck } from '../types';
import {
  listDecks,
  createDeck,
  updateDeckConfig,
  deleteDeck,
  ensureDecksRoot,
} from '../storage/deckStorage';

type UseDecksResult = {
  decks: Deck[]
  loading: boolean
  error: string | null
  clearError: () => void
  createDeck: (name: string, coverColor: string, icon: string) => Promise<Deck | null>
  updateDeck: (deck: Deck, newName: string, coverColor: string, icon: string) => Promise<Deck | null>
  deleteDeck: (id: string) => Promise<void>
  adjustCardCount: (deckId: string, delta: number) => void
}

const DecksContext = createContext<UseDecksResult | null>(null);

export function DecksProvider({ children }: { children: React.ReactNode }) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      await ensureDecksRoot();
      setDecks(await listDecks());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load decks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateDeck = useCallback(async (
    name: string, coverColor: string, icon: string,
  ): Promise<Deck | null> => {
    try {
      const deck = await createDeck(name, coverColor, icon);
      setDecks(prev => [...prev, deck].sort((a, b) => a.name.localeCompare(b.name)));
      return deck;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create deck.');
      return null;
    }
  }, []);

  const handleUpdateDeck = useCallback(async (
    deck: Deck, newName: string, coverColor: string, icon: string,
  ): Promise<Deck | null> => {
    try {
      const config = { name: newName, coverColor, icon };
      await updateDeckConfig(deck.id, config);
      const updated = { ...deck, ...config };
      setDecks(prev =>
        prev.map(d => d.id === deck.id ? updated : d)
            .sort((a, b) => a.name.localeCompare(b.name)),
      );
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update deck.');
      return null;
    }
  }, []);

  const handleDeleteDeck = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteDeck(id);
      setDecks(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete deck.');
    }
  }, []);

  const adjustCardCount = useCallback((deckId: string, delta: number) => {
    setDecks(prev => prev.map(d =>
      d.id === deckId ? { ...d, cardCount: d.cardCount + delta } : d,
    ));
  }, []);

  return (
    <DecksContext.Provider value={{
      decks,
      loading,
      error,
      clearError: () => setError(null),
      createDeck: handleCreateDeck,
      updateDeck: handleUpdateDeck,
      deleteDeck: handleDeleteDeck,
      adjustCardCount,
    }}>
      {children}
    </DecksContext.Provider>
  );
}

export function useDecks(): UseDecksResult {
  const ctx = useContext(DecksContext);
  if (!ctx) throw new Error('useDecks used outside DecksProvider');
  return ctx;
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: exits 0, no output. (New file, nothing imports it yet.)

- [ ] **Step 3: Commit**

```bash
git add src/context/DecksContext.tsx
git commit -m "feat: add DecksContext provider"
```

---

## Task 2: Create CardsContext

**Files:**
- Create: `src/context/CardsContext.tsx`

Same pattern as Task 1. Provider holds one deck's card state at a time — fresh load when `deckId` changes. `useCards(deckId)` connects the component and triggers the load.

- [ ] **Step 1: Write CardsContext**

Create `src/context/CardsContext.tsx` with this exact content:

```tsx
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { type Card, type CardData } from '../types';
import {
  listCards,
  createCard,
  updateCard,
  deleteCard,
} from '../storage/cardStorage';

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

const CardsContext = createContext<CardsContextValue | null>(null);

export function CardsProvider({ children }: { children: React.ReactNode }) {
  const [activeDeckId, setActiveDeck] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeDeckId) return;
    let cancelled = false;
    setLoading(true);
    setCards([]);
    (async () => {
      try {
        const result = await listCards(activeDeckId);
        if (!cancelled) setCards(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load cards.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeDeckId]);

  const handleCreateCard = useCallback(async (
    data: Omit<CardData, 'score'>,
  ): Promise<Card | null> => {
    try {
      const card = await createCard(activeDeckId, data);
      setCards(prev => [...prev, card].sort((a, b) => a.word.localeCompare(b.word)));
      return card;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create card.');
      return null;
    }
  }, [activeDeckId]);

  const handleUpdateCard = useCallback(async (
    cardId: string, data: Partial<CardData>,
  ): Promise<Card | null> => {
    try {
      const updated = await updateCard(activeDeckId, cardId, data);
      setCards(prev =>
        prev.map(c => c.id === cardId ? updated : c)
            .sort((a, b) => a.word.localeCompare(b.word)),
      );
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update card.');
      return null;
    }
  }, [activeDeckId]);

  const handleDeleteCard = useCallback(async (cardId: string): Promise<void> => {
    try {
      await deleteCard(activeDeckId, cardId);
      setCards(prev => prev.filter(c => c.id !== cardId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete card.');
    }
  }, [activeDeckId]);

  return (
    <CardsContext.Provider value={{
      cards,
      loading,
      error,
      clearError: () => setError(null),
      setActiveDeck,
      createCard: handleCreateCard,
      updateCard: handleUpdateCard,
      deleteCard: handleDeleteCard,
    }}>
      {children}
    </CardsContext.Provider>
  );
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

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: exits 0, no output.

- [ ] **Step 3: Commit**

```bash
git add src/context/CardsContext.tsx
git commit -m "feat: add CardsContext provider"
```

---

## Task 3: Wire providers — hooks, App.tsx, useViewManager

**Files:**
- Modify: `src/hooks/useDecks.ts`
- Modify: `src/hooks/useCards.ts`
- Modify: `src/hooks/useViewManager.ts`
- Modify: `src/App.tsx`

This is the pivotal task. All four files change together so the app stays TypeScript-clean and runtime-correct. After this task:
- `useDecks()` reads from context (requires being inside `<DecksProvider>`)
- `useCards(deckId)` reads from context (requires being inside `<CardsProvider>`)
- `App.tsx` wraps everything in providers — `AppShell` is always inside both providers
- `useViewManager` calls `useDecks()` internally; App no longer passes `decks` to it

The prop signatures of the views don't change yet — AppShell still passes the same props as before.

- [ ] **Step 1: Replace `src/hooks/useDecks.ts`**

```ts
export { useDecks } from '../context/DecksContext';
```

- [ ] **Step 2: Replace `src/hooks/useCards.ts`**

```ts
export { useCards } from '../context/CardsContext';
```

- [ ] **Step 3: Update `src/hooks/useViewManager.ts`**

Replace the entire file:

```ts
import { useState, useEffect } from 'react';
import { useDecks } from './useDecks';
import { type Deck } from '../types';

export type AppMode = 'manage' | 'learn'
export type AppView = { screen: 'home' } | { screen: 'deck-detail'; deckId: string }

type UseViewManagerResult = {
  mode: AppMode
  view: AppView
  learnDeckId: string | null
  currentDeck: Deck | undefined
  learnDeck: Deck | undefined
  changeMode: (m: AppMode) => void
  setView: (v: AppView) => void
  setLearnDeckId: (id: string | null) => void
}

export function useViewManager(): UseViewManagerResult {
  const { decks } = useDecks();
  const [mode, setMode] = useState<AppMode>('manage');
  const [view, setView] = useState<AppView>({ screen: 'home' });
  const [learnDeckId, setLearnDeckId] = useState<string | null>(null);

  useEffect(() => {
    if (decks.length === 0) setMode('manage');
  }, [decks.length]);

  const changeMode = (m: AppMode) => {
    setMode(m);
    if (m === 'learn' && !learnDeckId && decks.length > 0) {
      setLearnDeckId(decks[0].id);
    }
  };

  const currentDeck = view.screen === 'deck-detail' ? decks.find(d => d.id === view.deckId) : undefined;
  const learnDeck = learnDeckId
    ? (decks.find(d => d.id === learnDeckId) ?? decks[0])
    : decks[0];

  return { mode, view, learnDeckId, currentDeck, learnDeck, changeMode, setView, setLearnDeckId };
}
```

- [ ] **Step 4: Rewrite `src/App.tsx`**

Replace the entire file:

```tsx
import { DecksProvider } from './context/DecksContext';
import { CardsProvider } from './context/CardsContext';
import { useDecks } from './hooks/useDecks';
import { useViewManager } from './hooks/useViewManager';
import TopBar from './components/TopBar';
import DeckGridView from './views/DeckGridView';
import DeckDetailView from './views/DeckDetailView';
import LearnView from './views/LearnView';

function AppShell() {
  const { decks, loading, error, clearError,
          createDeck, updateDeck, deleteDeck, adjustCardCount } = useDecks();
  const { mode, view, learnDeckId, currentDeck, learnDeck,
          changeMode, setView, setLearnDeckId } = useViewManager();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans text-ink-300">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-ink antialiased">
      <TopBar
        mode={mode}
        onModeChange={changeMode}
        canLearn={decks.length > 0}
        decks={decks}
      />
      {error && (
        <div className="bg-bad/10 border border-bad/30 text-bad-700 text-sm px-6 py-3 flex items-center justify-between">
          {error}
          <button onClick={clearError} className="text-bad-700 opacity-60 hover:opacity-100 bg-transparent border-0 cursor-pointer">✕</button>
        </div>
      )}
      {mode === 'learn' && learnDeck ? (
        <LearnView
          deck={learnDeck}
          allDecks={decks.filter(d => d.id !== learnDeckId)}
          onPickDeck={setLearnDeckId}
          onExit={() => changeMode('manage')}
        />
      ) : view.screen === 'home' ? (
        <DeckGridView
          decks={decks}
          createDeck={createDeck}
          updateDeck={updateDeck}
          deleteDeck={deleteDeck}
          onOpenDeck={id => setView({ screen: 'deck-detail', deckId: id })}
        />
      ) : currentDeck ? (
        <DeckDetailView
          deck={currentDeck}
          allDeckNames={decks.map(d => d.name)}
          updateDeck={updateDeck}
          deleteDeck={deleteDeck}
          adjustCardCount={adjustCardCount}
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

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: exits 0, no output.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useDecks.ts src/hooks/useCards.ts src/hooks/useViewManager.ts src/App.tsx
git commit -m "refactor: wire DecksContext and CardsContext — providers wrap app, hooks re-export from context"
```

---

## Task 4: TopBar calls useDecks() directly

**Files:**
- Modify: `src/components/TopBar.tsx`
- Modify: `src/App.tsx` (AppShell — remove `canLearn` and `decks` props from `<TopBar>`)

- [ ] **Step 1: Rewrite `src/components/TopBar.tsx`**

```tsx
import { type AppMode } from '../hooks/useViewManager';
import { useDecks } from '../hooks/useDecks';
import Icon from './Icon';

type TopBarProps = {
  mode: AppMode
  onModeChange: (mode: AppMode) => void
}

export default function TopBar({ mode, onModeChange }: TopBarProps) {
  const { decks } = useDecks();
  const canLearn = decks.length > 0;
  const totalDecks = decks.length;
  const totalCards = decks.reduce((sum, d) => sum + d.cardCount, 0);

  return (
    <div className="flex items-center gap-[18px] px-7 py-[14px] border-b border-ink-700/10 bg-cream-100/70 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-2.5 font-display font-bold text-lg tracking-tight">
        <div
          className="relative w-[30px] h-[30px] rounded-[9px]"
          style={{
            background: 'linear-gradient(135deg, #e07a5f, #f0a07f)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.4), 0 4px 10px -4px rgba(224,122,95,.5)',
          }}
        >
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#fff8ed]/85" />
        </div>
        VocabCards
      </div>

      <div className="inline-flex p-[3px] gap-0.5 bg-ink-700/[.06] rounded-full border border-ink-700/10">
        <button
          onClick={() => onModeChange('manage')}
          className={`appearance-none border-0 cursor-pointer px-4 py-[7px] rounded-full font-semibold text-[13px] inline-flex items-center gap-2 transition-all ${
            mode === 'manage'
              ? 'bg-white text-ink-700 shadow-[0_1px_0_rgba(255,255,255,.7)_inset,0_2px_6px_-2px_rgba(43,29,18,.18)]'
              : 'bg-transparent text-ink-500'
          }`}
        >
          <Icon name="folder" size={15} /> Manage
        </button>
        <button
          onClick={() => canLearn && onModeChange('learn')}
          disabled={!canLearn}
          title={canLearn ? undefined : 'Add cards to a deck first'}
          className={`appearance-none border-0 cursor-pointer px-4 py-[7px] rounded-full font-semibold text-[13px] inline-flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            mode === 'learn'
              ? 'bg-white text-ink-700 shadow-[0_1px_0_rgba(255,255,255,.7)_inset,0_2px_6px_-2px_rgba(43,29,18,.18)]'
              : 'bg-transparent text-ink-500'
          }`}
        >
          <Icon name="sparkles" size={15} /> Learn
        </button>
      </div>

      <div className="flex-1" />

      {totalDecks > 0 && (
        <>
          <div className="inline-flex items-center gap-2 text-xs text-ink-500 font-medium px-2.5 py-1.5 rounded-full border border-ink-700/10 bg-white/50">
            <Icon name="book" size={13} /> {totalDecks} {totalDecks === 1 ? 'deck' : 'decks'}
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-ink-500 font-medium px-2.5 py-1.5 rounded-full border border-ink-700/10 bg-white/50">
            <Icon name="cards" size={13} /> {totalCards} {totalCards === 1 ? 'card' : 'cards'}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `<TopBar>` call in `src/App.tsx` (AppShell)**

In `src/App.tsx`, replace:
```tsx
      <TopBar
        mode={mode}
        onModeChange={changeMode}
        canLearn={decks.length > 0}
        decks={decks}
      />
```
with:
```tsx
      <TopBar mode={mode} onModeChange={changeMode} />
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: exits 0, no output.

- [ ] **Step 4: Commit**

```bash
git add src/components/TopBar.tsx src/App.tsx
git commit -m "refactor: TopBar calls useDecks() directly — drops decks/canLearn props"
```

---

## Task 5: DeckGridView calls useDecks() directly

**Files:**
- Modify: `src/views/DeckGridView.tsx`
- Modify: `src/App.tsx` (AppShell — remove deck props from `<DeckGridView>`)

- [ ] **Step 1: Rewrite `src/views/DeckGridView.tsx`**

```tsx
import { type Deck } from '../types';
import { useDecks } from '../hooks/useDecks';
import { useModalManager } from '../hooks/useModalManager';
import DeckCard from '../components/DeckCard';
import DeckEditor from '../components/DeckEditor';
import Confirm from '../components/Confirm';
import EmptyStateView from './EmptyStateView';
import Icon from '../components/Icon';

type DeckGridViewProps = {
  onOpenDeck: (id: string) => void
}

export default function DeckGridView({ onOpenDeck }: DeckGridViewProps) {
  const { decks, createDeck, updateDeck, deleteDeck } = useDecks();
  const {
    deckEditor, confirmDlg,
    openCreateDeck, openEditDeck, closeDeckEditor,
    openConfirm, closeConfirm,
  } = useModalManager();

  const handleSaveDeck = async (name: string, coverColor: string, icon: string) => {
    const deck = decks.find(d => d.id === deckEditor?.id);
    deck ? await updateDeck(deck, name, coverColor, icon) : await createDeck(name, coverColor, icon);
    closeDeckEditor();
  };

  const askDeleteDeck = (deck: Deck) => openConfirm({
    title: `Delete "${deck.name}"?`,
    message: 'All cards in this deck will be permanently deleted.',
    confirmText: 'Delete deck',
    danger: true,
    onConfirm: async () => {
      await deleteDeck(deck.id);
      closeConfirm();
      closeDeckEditor();
    },
  });

  if (decks.length === 0) return <EmptyStateView createDeck={createDeck} />;

  return (
    <div className="max-w-[1180px] mx-auto px-7 pt-9 pb-20 w-full">
      <div className="flex items-end justify-between mb-[22px] gap-5">
        <div>
          <div className="text-ink-300 text-[13px] font-medium mb-1.5">All decks</div>
          <h2 className="font-display font-bold text-[32px] tracking-tight m-0">Your decks</h2>
        </div>
        <button
          onClick={openCreateDeck}
          className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm bg-accent text-white shadow-accent hover:bg-accent-600"
        >
          <Icon name="plus" size={16} /> New deck
        </button>
      </div>

      <div className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {decks.map(deck => (
          <DeckCard
            key={deck.id}
            deck={deck}
            cardCount={deck.cardCount}
            onClick={() => onOpenDeck(deck.id)}
            onEdit={() => openEditDeck(deck)}
          />
        ))}
        <div
          onClick={openCreateDeck}
          className="relative aspect-[3/4] rounded-[20px] p-[18px] flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer border-2 border-dashed border-ink-700/20 text-ink-300 hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors"
        >
          <div className="w-[42px] h-[42px] rounded-full bg-current/15 grid place-items-center">
            <Icon name="plus" size={20} />
          </div>
          <div className="font-semibold text-sm">New deck</div>
          <div className="text-xs opacity-80">Group your words</div>
        </div>
      </div>

      {deckEditor !== null && (
        <DeckEditor
          deck={deckEditor}
          existingNames={decks.map(d => d.name)}
          onClose={closeDeckEditor}
          onSave={handleSaveDeck}
          onDelete={deckEditor.id ? () => {
            const d = decks.find(x => x.id === deckEditor.id);
            if (d) askDeleteDeck(d);
          } : undefined}
        />
      )}
      {confirmDlg && (
        <Confirm
          title={confirmDlg.title}
          message={confirmDlg.message}
          confirmText={confirmDlg.confirmText}
          danger={confirmDlg.danger}
          onConfirm={confirmDlg.onConfirm}
          onClose={closeConfirm}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `<DeckGridView>` call in `src/App.tsx` (AppShell)**

In `src/App.tsx`, replace:
```tsx
        <DeckGridView
          decks={decks}
          createDeck={createDeck}
          updateDeck={updateDeck}
          deleteDeck={deleteDeck}
          onOpenDeck={id => setView({ screen: 'deck-detail', deckId: id })}
        />
```
with:
```tsx
        <DeckGridView onOpenDeck={id => setView({ screen: 'deck-detail', deckId: id })} />
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: exits 0, no output.

- [ ] **Step 4: Commit**

```bash
git add src/views/DeckGridView.tsx src/App.tsx
git commit -m "refactor: DeckGridView calls useDecks() directly — drops deck mutation props"
```

---

## Task 6: DeckDetailView calls useDecks() directly

**Files:**
- Modify: `src/views/DeckDetailView.tsx`
- Modify: `src/App.tsx` (AppShell — remove mutation props from `<DeckDetailView>`)

- [ ] **Step 1: Update `src/views/DeckDetailView.tsx`**

Replace the prop type and add hook call. The JSX and handlers stay unchanged. Replace the top of the file (imports + type + function signature + hook calls):

```tsx
import { useState, useMemo } from 'react';
import { type Deck, type Card, type CardData } from '../types';
import { useDecks } from '../hooks/useDecks';
import { useCards } from '../hooks/useCards';
import { useModalManager } from '../hooks/useModalManager';
import DeckEditor from '../components/DeckEditor';
import CardEditor from '../components/CardEditor';
import Confirm from '../components/Confirm';
import CardTile from '../components/CardTile';
import Icon from '../components/Icon';

type DeckDetailViewProps = {
  deck: Deck
  onBack: () => void
  onStartLearn: () => void
}

export default function DeckDetailView({ deck, onBack, onStartLearn }: DeckDetailViewProps) {
  const [q, setQ] = useState('');
  const { decks, updateDeck, deleteDeck, adjustCardCount } = useDecks();
  const allDeckNames = decks.map(d => d.name);
  const { cards, createCard, updateCard, deleteCard } = useCards(deck.id);
  const {
    deckEditor, cardEditor, confirmDlg,
    openEditDeck, closeDeckEditor,
    openCreateCard, openEditCard, closeCardEditor,
    openConfirm, closeConfirm,
  } = useModalManager();

  // ... rest of the file unchanged from here
```

The full file after the change (complete content — copy the existing handlers and JSX verbatim, only the top changes):

```tsx
import { useState, useMemo } from 'react';
import { type Deck, type Card, type CardData } from '../types';
import { useDecks } from '../hooks/useDecks';
import { useCards } from '../hooks/useCards';
import { useModalManager } from '../hooks/useModalManager';
import DeckEditor from '../components/DeckEditor';
import CardEditor from '../components/CardEditor';
import Confirm from '../components/Confirm';
import CardTile from '../components/CardTile';
import Icon from '../components/Icon';

type DeckDetailViewProps = {
  deck: Deck
  onBack: () => void
  onStartLearn: () => void
}

export default function DeckDetailView({ deck, onBack, onStartLearn }: DeckDetailViewProps) {
  const [q, setQ] = useState('');
  const { decks, updateDeck, deleteDeck, adjustCardCount } = useDecks();
  const allDeckNames = decks.map(d => d.name);
  const { cards, createCard, updateCard, deleteCard } = useCards(deck.id);
  const {
    deckEditor, cardEditor, confirmDlg,
    openEditDeck, closeDeckEditor,
    openCreateCard, openEditCard, closeCardEditor,
    openConfirm, closeConfirm,
  } = useModalManager();

  const filtered = useMemo(() => {
    if (!q.trim()) return cards;
    const k = q.toLowerCase();
    return cards.filter(c =>
      c.word.toLowerCase().includes(k) ||
      c.translation.toLowerCase().includes(k) ||
      (c.sampleSentence ?? '').toLowerCase().includes(k),
    );
  }, [q, cards]);

  const handleSaveDeck = async (name: string, coverColor: string, icon: string) => {
    await updateDeck(deck, name, coverColor, icon);
    closeDeckEditor();
  };

  const askDeleteDeck = () => openConfirm({
    title: `Delete "${deck.name}"?`,
    message: 'All cards in this deck will be permanently deleted.',
    confirmText: 'Delete deck',
    danger: true,
    onConfirm: async () => {
      await deleteDeck(deck.id);
      closeConfirm();
      onBack();
    },
  });

  const handleSaveCard = async (data: Omit<CardData, 'score'>) => {
    if (cardEditor?.id) {
      await updateCard(cardEditor.id, data);
    } else {
      const created = await createCard(data);
      if (!created) return;
      adjustCardCount(deck.id, +1);
    }
    closeCardEditor();
  };

  const askDeleteCard = (card: Card) => openConfirm({
    title: `Delete "${card.word}"?`,
    message: 'This card will be permanently removed from the deck.',
    confirmText: 'Delete card',
    danger: true,
    onConfirm: async () => {
      await deleteCard(card.id);
      adjustCardCount(deck.id, -1);
      closeConfirm();
      closeCardEditor();
    },
  });

  const handleScoreCard = async (card: Card, delta: number) => {
    await updateCard(card.id, { score: (card.score ?? 0) + delta });
  };

  return (
    <div className="max-w-[1180px] mx-auto px-7 pt-9 pb-20 w-full">
      <div className="flex items-end justify-between mb-[22px] gap-5">
        <div>
          <div className="text-ink-300 text-[13px] font-medium mb-1.5 flex items-center gap-1.5">
            <button onClick={onBack} className="text-ink-500 cursor-pointer hover:text-ink-700 hover:underline bg-transparent border-0 p-0">
              All decks
            </button>
            <Icon name="chevron-r" size={12} />
            <span>{deck.name}</span>
          </div>
          <h2 className="font-display font-bold text-[32px] tracking-tight m-0 flex items-center gap-3">
            <span className="inline-grid place-items-center w-12 h-12 rounded-[14px] text-2xl shadow-soft" style={{ background: deck.coverColor }}>
              {deck.icon}
            </span>
            {deck.name}
          </h2>
        </div>
        <div className="flex gap-2.5 items-center">
          <button
            onClick={() => openEditDeck(deck)}
            className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-3 py-[7px] rounded-[10px] text-[12.5px] bg-transparent text-ink-700 border border-ink-700/20 hover:bg-ink-700/5"
          >
            <Icon name="edit" size={14} /> Edit deck
          </button>
          <button
            onClick={askDeleteDeck}
            className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-3 py-[7px] rounded-[10px] text-[12.5px] bg-transparent text-bad-700 border border-bad/30 hover:bg-bad/10"
          >
            <Icon name="trash" size={14} /> Delete
          </button>
          <button
            onClick={onStartLearn}
            disabled={cards.length === 0}
            className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm bg-ink-700 text-cream-100 shadow-ink hover:bg-[#1c130b] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name="sparkles" size={15} /> Start learning
          </button>
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap mb-5">
        {[
          { dot: '#7ca982', label: `${cards.filter(c => (c.score ?? 0) > 0).length} known well` },
          { dot: '#d97766', label: `${cards.filter(c => (c.score ?? 0) < 0).length} need practice` },
          { dot: '#9a8a78', label: `${cards.filter(c => (c.score ?? 0) === 0).length} unrated` },
        ].map(({ dot, label }) => (
          <span key={label} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-ink-700/10 text-[13px] text-ink-500 font-medium">
            <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
            {label}
          </span>
        ))}
      </div>

      {cards.length > 0 && (
        <div className="flex items-center gap-2.5 mb-[18px]">
          <div className="flex-1 max-w-[320px] relative">
            <Icon name="search" size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: .5 }} />
            <input
              placeholder="Search cards…"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full pl-9 pr-3 py-[9px] rounded-[10px] border border-ink-700/20 bg-white/60 font-sans focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15"
            />
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="text-center py-16 px-5 border-2 border-dashed border-ink-700/20 rounded-[20px] text-ink-300">
          <div className="text-[42px] mb-2">{deck.icon}</div>
          <h3 className="m-0 mb-1.5 text-ink-700 font-display font-bold">This deck is empty</h3>
          <p className="my-1 mb-[18px] text-sm">Add your first card to start learning.</p>
          <button
            onClick={() => openCreateCard(deck.id)}
            className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm bg-accent text-white shadow-accent hover:bg-accent-600"
          >
            <Icon name="plus" size={16} /> Add card
          </button>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {filtered.map(card => (
            <CardTile
              key={card.id}
              card={card}
              onEdit={() => openEditCard(card)}
              onDelete={() => askDeleteCard(card)}
              onScore={delta => handleScoreCard(card, delta)}
            />
          ))}
          <div
            onClick={() => openCreateCard(deck.id)}
            className="border-2 border-dashed border-ink-700/20 bg-transparent flex flex-col items-center justify-center text-center cursor-pointer min-h-[240px] text-ink-300 gap-2.5 p-[18px] rounded-[14px] hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-ink-700/[.08] grid place-items-center">
              <Icon name="plus" size={20} />
            </div>
            <div className="font-semibold text-sm">Add card</div>
          </div>
        </div>
      )}

      {deckEditor !== null && (
        <DeckEditor
          deck={deckEditor}
          existingNames={allDeckNames}
          onClose={closeDeckEditor}
          onSave={handleSaveDeck}
          onDelete={() => askDeleteDeck()}
        />
      )}
      {cardEditor !== null && (
        <CardEditor
          card={cardEditor}
          existingWords={cards.map(c => c.word)}
          onClose={closeCardEditor}
          onSave={handleSaveCard}
          onDelete={cardEditor.id ? () => askDeleteCard(cardEditor as Card) : undefined}
        />
      )}
      {confirmDlg && (
        <Confirm
          title={confirmDlg.title}
          message={confirmDlg.message}
          confirmText={confirmDlg.confirmText}
          danger={confirmDlg.danger}
          onConfirm={confirmDlg.onConfirm}
          onClose={closeConfirm}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `<DeckDetailView>` call in `src/App.tsx` (AppShell)**

In `src/App.tsx`, replace:
```tsx
        <DeckDetailView
          deck={currentDeck}
          allDeckNames={decks.map(d => d.name)}
          updateDeck={updateDeck}
          deleteDeck={deleteDeck}
          adjustCardCount={adjustCardCount}
          onBack={() => setView({ screen: 'home' })}
          onStartLearn={() => { setLearnDeckId(currentDeck.id); changeMode('learn'); }}
        />
```
with:
```tsx
        <DeckDetailView
          deck={currentDeck}
          onBack={() => setView({ screen: 'home' })}
          onStartLearn={() => { setLearnDeckId(currentDeck.id); changeMode('learn'); }}
        />
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: exits 0, no output.

- [ ] **Step 4: Commit**

```bash
git add src/views/DeckDetailView.tsx src/App.tsx
git commit -m "refactor: DeckDetailView calls useDecks() directly — drops mutation and allDeckNames props"
```

---

## Task 7: EmptyStateView calls useDecks() directly

**Files:**
- Modify: `src/views/EmptyStateView.tsx`
- Modify: `src/views/DeckGridView.tsx` (remove `createDeck` prop from `<EmptyStateView>` render)

- [ ] **Step 1: Rewrite `src/views/EmptyStateView.tsx`**

```tsx
import { useDecks } from '../hooks/useDecks';
import { useModalManager } from '../hooks/useModalManager';
import DeckEditor from '../components/DeckEditor';
import Icon from '../components/Icon';

function HeroCard({ className, en, it }: { className: string; en: string; it: string }) {
  return (
    <div className={`absolute left-1/2 top-1/2 w-[260px] h-[340px] rounded-3xl border border-ink-700/10 p-[18px] flex flex-col shadow-big ${className}`}>
      <div className="flex-1 rounded-[14px] mb-3.5 bg-stripes bg-white/40" />
      <div className="font-display font-bold text-2xl tracking-tight leading-none">{en}</div>
      <div className="text-ink-300 text-[13px] mt-1">{it}</div>
    </div>
  );
}

export default function EmptyStateView() {
  const { createDeck } = useDecks();
  const { deckEditor, openCreateDeck, closeDeckEditor } = useModalManager();

  const handleSaveDeck = async (name: string, coverColor: string, icon: string) => {
    await createDeck(name, coverColor, icon);
    closeDeckEditor();
  };

  return (
    <div className="max-w-[1180px] mx-auto px-7 pt-9 pb-20 w-full">
      <div className="mt-[6vh] grid grid-cols-1 md:grid-cols-[1.05fr_.95fr] gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent-600 text-xs font-semibold mb-[18px] tracking-wide">
            <Icon name="sparkles" size={13} />
            LEARN ENGLISH, ONE CARD AT A TIME
          </div>
          <h1
            className="font-display font-bold leading-[.98] tracking-tighter mb-[18px]"
            style={{ fontSize: 'clamp(40px, 5.4vw, 64px)' }}
          >
            Build your first<br />
            <em className="not-italic text-accent">vocabulary deck</em>.
          </h1>
          <p className="text-[17px] text-ink-500 max-w-[46ch] leading-relaxed mb-7">
            Group words into decks, attach a picture, a translation, and a sample sentence.
            Then flip through them, rate yourself with a thumbs up or down — and watch your
            weakest cards rise to the top.
          </p>
          <div className="flex gap-2.5 items-center">
            <button
              onClick={openCreateDeck}
              className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm bg-accent text-white shadow-accent hover:bg-accent-600"
            >
              <Icon name="plus" size={16} /> Create your first deck
            </button>
          </div>
        </div>
        <div className="relative h-[420px] [perspective:1200px]" aria-hidden="true">
          <HeroCard className="hero-c1 bg-peach" en="apple" it="mela" />
          <HeroCard className="hero-c2 bg-white z-[2]" en="house" it="casa" />
          <HeroCard className="hero-c3 bg-lav" en="cloud" it="nuvola" />
        </div>
      </div>

      {deckEditor !== null && (
        <DeckEditor
          deck={deckEditor}
          existingNames={[] /* safe: this view only renders when decks.length === 0 */}
          onClose={closeDeckEditor}
          onSave={handleSaveDeck}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `<EmptyStateView>` render in `src/views/DeckGridView.tsx`**

In `src/views/DeckGridView.tsx`, replace:
```tsx
  if (decks.length === 0) return <EmptyStateView createDeck={createDeck} />;
```
with:
```tsx
  if (decks.length === 0) return <EmptyStateView />;
```

Also remove the unused `createDeck` from DeckGridView's `useDecks()` destructuring if it was only used for this. Check: `createDeck` is also used in `handleSaveDeck` for new decks — keep it.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: exits 0, no output.

- [ ] **Step 4: Commit**

```bash
git add src/views/EmptyStateView.tsx src/views/DeckGridView.tsx
git commit -m "refactor: EmptyStateView calls useDecks() directly — no props"
```

---

## Task 8: LearnView calls useDecks() + final AppShell cleanup

**Files:**
- Modify: `src/views/LearnView.tsx`
- Modify: `src/App.tsx` (AppShell — remove `allDecks` prop, drop unused destructuring)

- [ ] **Step 1: Update `src/views/LearnView.tsx`**

Add `useDecks()` import and call, drop `allDecks` from props. Replace the top of the file (imports + type + function signature):

```tsx
import { type Deck, type CardData } from '../types';
import { useDecks } from '../hooks/useDecks';
import { useCards } from '../hooks/useCards';
import { useModalManager } from '../hooks/useModalManager';
import { useLearnSession } from '../hooks/useLearnSession';
import CardEditor from '../components/CardEditor';
import FlashCard from '../components/FlashCard';
import DeckPicker from '../components/DeckPicker';
import SessionCompleteView from './SessionCompleteView';
import Icon from '../components/Icon';
```

```tsx
type LearnViewProps = {
  deck: Deck
  onPickDeck: (id: string) => void
  onExit: () => void
}

export default function LearnView({ deck, onPickDeck, onExit }: LearnViewProps) {
  const { decks } = useDecks();
  const allDecks = decks.filter(d => d.id !== deck.id);
  const { cards, updateCard, loading } = useCards(deck.id);
  // ... rest of function body unchanged
```

Full updated file (complete, for copy-paste):

```tsx
import { type Deck, type CardData } from '../types';
import { useDecks } from '../hooks/useDecks';
import { useCards } from '../hooks/useCards';
import { useModalManager } from '../hooks/useModalManager';
import { useLearnSession } from '../hooks/useLearnSession';
import CardEditor from '../components/CardEditor';
import FlashCard from '../components/FlashCard';
import DeckPicker from '../components/DeckPicker';
import SessionCompleteView from './SessionCompleteView';
import Icon from '../components/Icon';

function speak(text: string) {
  if (!('speechSynthesis' in window) || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

type VerdictBtnProps = {
  variant: 'up' | 'down' | 'skip' | 'back'
  hint: string
  title: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

function VerdictBtn({ variant, hint, title, disabled, onClick, children }: VerdictBtnProps) {
  const base = 'appearance-none border-0 cursor-pointer grid place-items-center shrink-0 transition-all duration-150 shadow-[0_1px_0_rgba(255,255,255,.4)_inset,0_8px_24px_-8px_rgba(43,29,18,.3)] hover:-translate-y-0.5 hover:scale-[1.04] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100';
  const sizes: Record<string, string> = {
    up:   'w-[68px] h-[68px] rounded-full bg-good/25 text-good-700 hover:bg-good/40',
    down: 'w-[68px] h-[68px] rounded-full bg-bad/15 text-bad-700 hover:bg-bad/25',
    skip: 'w-12 h-12 rounded-full bg-white border border-ink-700/10 text-ink-500 hover:bg-cream-200 hover:scale-100',
    back: 'w-12 h-12 rounded-full bg-white border border-ink-700/10 text-ink-500 hover:bg-cream-200 hover:scale-100',
  };
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button onClick={onClick} title={title} disabled={disabled} className={`${base} ${sizes[variant]}`}>
        {children}
      </button>
      <span className="font-mono text-[10px] px-1.5 py-px border border-ink-700/20 rounded bg-white text-ink-300 mt-1.5">
        {hint}
      </span>
    </div>
  );
}

type LearnViewProps = {
  deck: Deck
  onPickDeck: (id: string) => void
  onExit: () => void
}

export default function LearnView({ deck, onPickDeck, onExit }: LearnViewProps) {
  const { decks } = useDecks();
  const allDecks = decks.filter(d => d.id !== deck.id);
  const { cards, updateCard, loading } = useCards(deck.id);
  const { cardEditor, openEditCard, closeCardEditor } = useModalManager();
  const session = useLearnSession(cards);
  const { currentCard, idx, total, flipped, streak, reviewed, done, flip, score, skip, goBack, restart } = session;

  const handleSaveCard = async (data: Omit<CardData, 'score'>) => {
    if (cardEditor?.id) await updateCard(cardEditor.id, data);
    closeCardEditor();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center font-sans text-ink-300">
        Loading…
      </div>
    );
  }

  if (done) {
    return <SessionCompleteView deck={deck} reviewed={reviewed} onRestart={restart} onExit={onExit} />;
  }

  if (!currentCard) {
    return (
      <div className="flex-1 flex flex-col items-center px-7 py-6 gap-5">
        <div className="text-center py-16 px-5 max-w-[520px]">
          <h2 className="font-display font-bold text-[42px] tracking-tight m-0 mb-3">This deck has no cards yet</h2>
          <p className="text-ink-500 text-base m-0 mb-6">Add some cards before starting a learning session.</p>
          <button onClick={onExit}
            className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm bg-accent text-white shadow-accent hover:bg-accent-600">
            <Icon name="plus" size={14} /> Manage cards
          </button>
        </div>
      </div>
    );
  }

  const pct = Math.round((idx / total) * 100);

  return (
    <div className="flex-1 grid grid-rows-[auto_1fr_auto_auto] px-7 pt-6 pb-8 gap-y-5 min-h-0 w-full">
      {/* Row 1: Header */}
      <div className="w-full max-w-[720px] mx-auto flex items-center justify-between gap-5">
        <DeckPicker currentDeck={deck} allDecks={allDecks} onPick={onPickDeck} />
        <div className="flex-1 max-w-[380px] flex flex-col gap-1.5">
          <div className="h-2 bg-ink-700/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #e07a5f, #f5b399)' }} />
          </div>
          <div className="flex justify-between text-xs text-ink-300 tabular-nums">
            <span>Card {idx + 1} of {total}</span>
            <span>{pct}%</span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-ink-700/10 font-semibold text-sm" title="Streak: consecutive thumbs-ups">
          <span style={{ color: streak > 0 ? '#e07a5f' : '#9a8a78', filter: 'drop-shadow(0 1px 2px rgba(224,122,95,.3))' }}>
            <Icon name="flame" size={16} />
          </span>
          {streak}
        </div>
      </div>

      {/* Row 2: Flashcard */}
      <div className="flex items-center justify-center min-h-0">
        <FlashCard
          card={currentCard}
          flipped={flipped}
          flashClass=""
          onClick={flip}
          onSpeak={speak}
        />
      </div>

      {/* Row 3: Verdict buttons */}
      <div className="flex gap-3.5 items-center justify-center">
        <VerdictBtn variant="down" hint="↓" title="Thumbs down (↓)" onClick={() => score(-1)}>
          <Icon name="thumb-down" size={28} />
        </VerdictBtn>
        <VerdictBtn variant="back" hint="←" title="Previous card (←)" disabled={idx === 0} onClick={goBack}>
          <Icon name="arrow-l" size={20} />
        </VerdictBtn>
        <VerdictBtn variant="skip" hint="→" title="Skip (→)" onClick={skip}>
          <Icon name="skip" size={20} />
        </VerdictBtn>
        <VerdictBtn variant="up" hint="↑" title="Thumbs up (↑)" onClick={() => score(1)}>
          <Icon name="thumb-up" size={28} />
        </VerdictBtn>
      </div>

      {/* Row 4: Bottom CTAs */}
      <div className="flex gap-2 text-ink-300 text-xs justify-center">
        <button onClick={() => openEditCard(currentCard)}
          className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-3 py-[7px] rounded-[10px] text-[12.5px] bg-transparent text-ink-500 hover:text-ink-700 hover:bg-ink-700/5 border-0">
          <Icon name="edit" size={13} /> Edit this card
        </button>
        <button onClick={onExit}
          className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-3 py-[7px] rounded-[10px] text-[12.5px] bg-transparent text-ink-500 hover:text-ink-700 hover:bg-ink-700/5 border-0">
          <Icon name="folder" size={13} /> Manage decks
        </button>
      </div>

      {cardEditor !== null && (
        <CardEditor
          card={cardEditor}
          existingWords={cards.map(c => c.word)}
          onClose={closeCardEditor}
          onSave={handleSaveCard}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `<LearnView>` call and clean up AppShell in `src/App.tsx`**

Replace the entire `src/App.tsx` with the final clean version:

```tsx
import { DecksProvider } from './context/DecksContext';
import { CardsProvider } from './context/CardsContext';
import { useDecks } from './hooks/useDecks';
import { useViewManager } from './hooks/useViewManager';
import TopBar from './components/TopBar';
import DeckGridView from './views/DeckGridView';
import DeckDetailView from './views/DeckDetailView';
import LearnView from './views/LearnView';

function AppShell() {
  const { loading, error, clearError } = useDecks();
  const { mode, view, currentDeck, learnDeck,
          changeMode, setView, setLearnDeckId } = useViewManager();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans text-ink-300">
        Loading…
      </div>
    );
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
        <LearnView
          deck={learnDeck}
          onPickDeck={setLearnDeckId}
          onExit={() => changeMode('manage')}
        />
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

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: exits 0, no output.

- [ ] **Step 4: Commit**

```bash
git add src/views/LearnView.tsx src/App.tsx
git commit -m "refactor: LearnView calls useDecks() directly — AppShell is now a pure router"
```

---

## Task 9: Smoke test

```bash
npm run tauri dev
```

- [ ] Empty state → "Create your first deck" → deck appears in grid → TopBar shows deck/card counts
- [ ] Home grid → "New deck" → create → deck appears; "Edit" → rename → saved; "Delete" → deck removed
- [ ] Open a deck → "Add card" → card appears; edit it → changes saved; delete it → count decrements
- [ ] Open a deck → "Delete" deck → navigates back to home
- [ ] Score a card with thumbs up/down → score stats update immediately
- [ ] Enter learn mode → edit a card mid-session → change saved
- [ ] Switch decks in learn mode via DeckPicker → cards reload for new deck
- [ ] TopBar card count reflects global total across all decks
