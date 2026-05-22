import { useDecks } from './hooks/useDecks';
import { useViewManager } from './hooks/useViewManager';
import TopBar from './components/TopBar';
import EmptyStateView from './views/EmptyStateView';
import DeckGridView from './views/DeckGridView';
import DeckDetailView from './views/DeckDetailView';
import LearnView from './views/LearnView';

export default function App() {
  const { decks, loading, error, clearError,
          createDeck, updateDeck, deleteDeck, adjustCardCount } = useDecks();
  const { mode, view, learnDeckId, currentDeck, learnDeck,
          changeMode, setView, setLearnDeckId } = useViewManager(decks);

  const totalCards = decks.reduce((sum, d) => sum + d.cardCount, 0);

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
        totalDecks={decks.length}
        totalCards={totalCards}
      />

      {error && (
        <div className="bg-bad/10 border border-bad/30 text-bad-700 text-sm px-6 py-3 flex items-center justify-between">
          {error}
          <button onClick={clearError} className="text-bad-700 opacity-60 hover:opacity-100 bg-transparent border-0 cursor-pointer">✕</button>
        </div>
      )}

      {decks.length === 0 ? (
        <EmptyStateView createDeck={createDeck} />
      ) : mode === 'learn' && learnDeck ? (
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
