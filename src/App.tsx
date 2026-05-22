import { type Deck, type Card, type CardData } from './types';
import { useDecks } from './hooks/useDecks';
import { useCards } from './hooks/useCards';
import { useViewManager, type AppMode } from './hooks/useViewManager';
import { useModalManager } from './hooks/useModalManager';
import TopBar from './components/TopBar';
import EmptyStateView from './views/EmptyStateView';
import DeckGridView from './views/DeckGridView';
import DeckDetailView from './views/DeckDetailView';
import DeckEditor from './components/DeckEditor';
import CardEditor from './components/CardEditor';
import LearnView from './views/LearnView';
import Confirm from './components/Confirm';
import { updateCard as storageUpdateCard } from './storage/cardStorage';

export default function App() {
  const { decks, loading: decksLoading, error: decksError, clearError: clearDecksError,
          createDeck, updateDeck, deleteDeck, adjustCardCount } = useDecks();

  const { mode, view, learnDeckId, managedDeckId, currentDeck, learnDeck,
          changeMode, setView, setLearnDeckId } = useViewManager(decks);

  const { deckEditor, cardEditor, confirmDlg,
          openEditDeck, closeDeckEditor,
          openCreateCard, openEditCard, closeCardEditor,
          openConfirm, closeConfirm } = useModalManager();

  // learnDeckId is always set when mode === 'learn' (changeMode sets both atomically)
  const activeDeckId = mode === 'learn' ? learnDeckId! : managedDeckId;
  const { cards, createCard, updateCard, deleteCard } = useCards(activeDeckId);

  /* ── Deck handlers ────────────────────────────────────────────────────── */
  const handleSaveDeck = async (name: string, coverColor: string, icon: string) => {
    if (deckEditor?.id) {
      const existing = decks.find(d => d.id === deckEditor.id)!;
      await updateDeck(existing, name, coverColor, icon);
    } else {
      await createDeck(name, coverColor, icon);
    }
    closeDeckEditor();
  };

  const askDeleteDeck = (deck: Deck) => {
    openConfirm({
      title: `Delete "${deck.name}"?`,
      message: 'All cards in this deck will be permanently deleted.',
      confirmText: 'Delete deck',
      danger: true,
      onConfirm: async () => {
        await deleteDeck(deck.id);
        setView({ screen: 'home' });
        closeConfirm();
        closeDeckEditor();
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
      adjustCardCount(activeDeckId, +1);
    }
    closeCardEditor();
  };

  const askDeleteCard = (card: Card) => {
    openConfirm({
      title: `Delete "${card.word}"?`,
      message: 'This card will be permanently removed from the deck.',
      confirmText: 'Delete card',
      danger: true,
      onConfirm: async () => {
        await deleteCard(card.id);
        adjustCardCount(card.deckId, -1);
        closeConfirm();
        closeCardEditor();
      },
    });
  };

  const handleScoreCard = async (card: Card, delta: number) => {
    await storageUpdateCard(card.deckId, card.id, { score: (card.score ?? 0) + delta });
  };

  const handleModeChange = (m: AppMode) => {
    if (m === 'learn' && decks.length === 0) return;
    changeMode(m);
  };

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
        onModeChange={handleModeChange}
        canLearn={decks.length > 0}
        totalDecks={decks.length}
        totalCards={cards.length}
      />

      {decksError && (
        <div className="bg-bad/10 border border-bad/30 text-bad-700 text-sm px-6 py-3 flex items-center justify-between">
          {decksError}
          <button onClick={clearDecksError} className="text-bad-700 opacity-60 hover:opacity-100 bg-transparent border-0 cursor-pointer">✕</button>
        </div>
      )}

      {decks.length === 0 ? (
        <EmptyStateView createDeck={createDeck} />
      ) : mode === 'learn' && learnDeck ? (
        <LearnView
          deck={learnDeck}
          allDecks={decks.filter(d => d.id !== learnDeckId)}
          cards={cards}
          onPickDeck={id => setLearnDeckId(id)}
          onExit={() => changeMode('manage')}
          onEditCard={openEditCard}
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
          cards={cards}
          onBack={() => setView({ screen: 'home' })}
          onStartLearn={() => { setLearnDeckId(currentDeck.id); changeMode('learn'); }}
          onEditDeck={() => openEditDeck(currentDeck)}
          onDeleteDeck={() => askDeleteDeck(currentDeck)}
          onCreateCard={() => openCreateCard(currentDeck.id)}
          onEditCard={openEditCard}
          onDeleteCard={askDeleteCard}
          onScoreCard={handleScoreCard}
        />
      ) : null}

      {deckEditor !== null && (
        <DeckEditor
          deck={deckEditor}
          existingNames={decks.map(d => d.name)}
          onClose={closeDeckEditor}
          onSave={handleSaveDeck}
          onDelete={deckEditor.id ? () => askDeleteDeck(decks.find(d => d.id === deckEditor.id)!) : undefined}
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
