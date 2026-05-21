import { useState, useEffect, useMemo } from 'react';
import { type Deck, type Card, type CardData } from './types';
import { useDecks } from './hooks/useDecks';
import { useCards } from './hooks/useCards';
import { VIRTUAL_DECKS } from './components/DeckPicker';
import TopBar from './components/TopBar';
import EmptyState from './components/EmptyState';
import DeckGrid from './components/DeckGrid';
import DeckDetail from './components/DeckDetail';
import DeckEditor from './components/DeckEditor';
import CardEditor from './components/CardEditor';
import LearnView from './components/LearnView';
import Confirm from './components/Confirm';
import { updateCard as storageUpdateCard, listCards } from './storage/cardStorage';

type AppMode = 'manage' | 'learn'
type AppView = { screen: 'home' } | { screen: 'deck-detail'; deckId: string }

type ConfirmState = {
  title: string
  message: string
  confirmText: string
  danger: boolean
  onConfirm: () => void
}

type DeckEditorState = Partial<Deck>
type CardEditorState = Partial<Card> & { deckId: string }

export default function App() {
  const { decks, loading: decksLoading, error: decksError, clearError: clearDecksError,
          createDeck, updateDeck, deleteDeck } = useDecks();

  const [mode, setMode]         = useState<AppMode>('manage');
  const [view, setView]         = useState<AppView>({ screen: 'home' });
  const [learnDeckId, setLearnDeckId] = useState<string | null>(null);
  const [deckEditor, setDeckEditor]   = useState<DeckEditorState | null>(null);
  const [cardEditor, setCardEditor]   = useState<CardEditorState | null>(null);
  const [confirmDlg, setConfirmDlg]   = useState<ConfirmState | null>(null);

  // Cards are loaded per-deck. In learn mode we need cards for the active learn deck.
  const managedDeckId = view.screen === 'deck-detail' ? view.deckId : '';
  const learnSourceId = learnDeckId && !['__all__', '__random__'].includes(learnDeckId)
    ? learnDeckId
    : '';

  const { cards: managedCards, createCard, updateCard, deleteCard } = useCards(managedDeckId);

  // For virtual decks (all / random) we need all cards across all real decks.
  // We accumulate them by loading each deck's cards lazily via a separate hook
  // instance that only runs when the learn deck is a virtual one.
  const [allCards, setAllCards] = useState<Card[]>([]);
  useEffect(() => {
    if (!['__all__', '__random__'].includes(learnDeckId ?? '')) return;
    // Load all cards from all real decks
    Promise.all(decks.map(d => listCards(d.id)))
      .then(results => setAllCards(results.flat()))
      .catch(() => {});
  }, [learnDeckId, decks]);

  const { cards: learnDeckCards } = useCards(learnSourceId);

  const learnCards = useMemo(() => {
    if (!learnDeckId) return [];
    if (['__all__', '__random__'].includes(learnDeckId)) return allCards;
    return learnDeckCards;
  }, [learnDeckId, learnDeckCards, allCards]);

  const learnDeck: Deck | undefined = useMemo(() => {
    if (!learnDeckId) return decks[0];
    const virtual = VIRTUAL_DECKS.find(d => d.id === learnDeckId);
    if (virtual) return virtual;
    return decks.find(d => d.id === learnDeckId) ?? decks[0];
  }, [learnDeckId, decks]);

  // Card count map for DeckGrid
  const cardCountByDeckId = useMemo(() => {
    // We only know counts for the currently managed deck without loading all cards.
    // For the grid we show a rough count per deck. This is reloaded when needed.
    return Object.fromEntries(decks.map(d => [d.id, d.id === managedDeckId ? managedCards.length : 0]));
  }, [decks, managedDeckId, managedCards]);

  // Switch to manage when last deck is deleted
  useEffect(() => {
    if (decks.length === 0) setMode('manage');
  }, [decks.length]);

  // Default learn deck on entering learn mode
  useEffect(() => {
    if (mode === 'learn' && !learnDeckId && decks.length > 0) {
      setLearnDeckId(decks[0].id);
    }
  }, [mode, learnDeckId, decks]);

  // Keyboard shortcut: N to create deck or card
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (deckEditor || cardEditor || confirmDlg) return;
      if (e.key.toLowerCase() !== 'n' || mode !== 'manage') return;
      e.preventDefault();
      if (view.screen === 'home') {
        setDeckEditor({});
      } else if (view.screen === 'deck-detail') {
        setCardEditor({ deckId: view.deckId });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, view, deckEditor, cardEditor, confirmDlg]);

  /* ── Deck handlers ────────────────────────────────────────────────────── */
  const handleSaveDeck = async (name: string, coverColor: string, icon: string) => {
    if (deckEditor?.id) {
      const existing = decks.find(d => d.id === deckEditor.id)!;
      await updateDeck(existing, name, coverColor, icon);
    } else {
      await createDeck(name, coverColor, icon);
    }
    setDeckEditor(null);
  };

  const askDeleteDeck = (deck: Deck) => {
    setConfirmDlg({
      title: `Delete "${deck.name}"?`,
      message: 'All cards in this deck will be permanently deleted.',
      confirmText: 'Delete deck',
      danger: true,
      onConfirm: async () => {
        await deleteDeck(deck.id);
        setView({ screen: 'home' });
        setConfirmDlg(null);
        setDeckEditor(null);
      },
    });
  };

  /* ── Card handlers ────────────────────────────────────────────────────── */
  const handleSaveCard = async (data: Omit<CardData, 'score'>) => {
    if (!cardEditor) return;
    if (cardEditor.id) {
      await updateCard(cardEditor.id, data);
    } else {
      await createCard(data);
    }
    setCardEditor(null);
  };

  const askDeleteCard = (card: Card) => {
    setConfirmDlg({
      title: `Delete "${card.word}"?`,
      message: 'This card will be permanently removed from the deck.',
      confirmText: 'Delete card',
      danger: true,
      onConfirm: async () => {
        await deleteCard(card.id);
        setConfirmDlg(null);
        setCardEditor(null);
      },
    });
  };

  const handleScoreCard = async (card: Card, delta: number) => {
    await storageUpdateCard(card.deckId, card.id, { score: (card.score ?? 0) + delta });
  };

  /* ── Current deck (manage) ────────────────────────────────────────────── */
  const currentDeck = view.screen === 'deck-detail'
    ? decks.find(d => d.id === view.deckId)
    : null;

  if (decksLoading) {
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
        onModeChange={m => {
          if (m === 'learn' && (decks.length === 0 || managedCards.length + learnCards.length === 0)) return;
          setMode(m);
        }}
        canLearn={decks.length > 0}
        totalDecks={decks.length}
        totalCards={managedCards.length}
      />

      {decksError && (
        <div className="bg-bad/10 border border-bad/30 text-bad-700 text-sm px-6 py-3 flex items-center justify-between">
          {decksError}
          <button onClick={clearDecksError} className="text-bad-700 opacity-60 hover:opacity-100 bg-transparent border-0 cursor-pointer">✕</button>
        </div>
      )}

      {decks.length === 0 ? (
        <EmptyState onCreate={() => setDeckEditor({})} />
      ) : mode === 'learn' && learnDeck ? (
        <LearnView
          deck={learnDeck}
          allDecks={decks.filter(d => d.id !== learnDeckId)}
          cards={learnCards}
          onPickDeck={id => setLearnDeckId(id)}
          onExit={() => setMode('manage')}
          onEditCard={card => setCardEditor({ ...card })}
        />
      ) : view.screen === 'home' ? (
        <DeckGrid
          decks={decks}
          cardCountByDeckId={cardCountByDeckId}
          onOpenDeck={id => setView({ screen: 'deck-detail', deckId: id })}
          onCreate={() => setDeckEditor({})}
          onEdit={deck => setDeckEditor(deck)}
        />
      ) : currentDeck ? (
        <DeckDetail
          deck={currentDeck}
          cards={managedCards}
          onBack={() => setView({ screen: 'home' })}
          onStartLearn={() => { setLearnDeckId(currentDeck.id); setMode('learn'); }}
          onEditDeck={() => setDeckEditor(currentDeck)}
          onDeleteDeck={() => askDeleteDeck(currentDeck)}
          onCreateCard={() => setCardEditor({ deckId: currentDeck.id })}
          onEditCard={card => setCardEditor({ ...card })}
          onDeleteCard={askDeleteCard}
          onScoreCard={handleScoreCard}
        />
      ) : null}

      {deckEditor !== null && (
        <DeckEditor
          deck={deckEditor}
          existingNames={decks.map(d => d.name)}
          onClose={() => setDeckEditor(null)}
          onSave={handleSaveDeck}
          onDelete={deckEditor.id ? () => askDeleteDeck(decks.find(d => d.id === deckEditor.id)!) : undefined}
        />
      )}

      {cardEditor !== null && (
        <CardEditor
          card={cardEditor}
          existingWords={managedCards.map(c => c.word)}
          onClose={() => setCardEditor(null)}
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
          onClose={() => setConfirmDlg(null)}
        />
      )}
    </div>
  );
}
