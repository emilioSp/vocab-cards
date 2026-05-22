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

  if (decks.length === 0) return <EmptyStateView />;

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
