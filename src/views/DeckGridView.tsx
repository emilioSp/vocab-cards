import { type Deck } from '../types';
import DeckCard from '../components/DeckCard';
import Icon from '../components/Icon';

type DeckGridViewProps = {
  decks: Deck[]
  cardCountByDeckId: Record<string, number>
  onOpenDeck: (id: string) => void
  onCreate: () => void
  onEdit: (deck: Deck) => void
}

export default function DeckGridView({ decks, cardCountByDeckId, onOpenDeck, onCreate, onEdit }: DeckGridViewProps) {
  return (
    <div className="max-w-[1180px] mx-auto px-7 pt-9 pb-20 w-full">
      <div className="flex items-end justify-between mb-[22px] gap-5">
        <div>
          <div className="text-ink-300 text-[13px] font-medium mb-1.5">All decks</div>
          <h2 className="font-display font-bold text-[32px] tracking-tight m-0">Your decks</h2>
        </div>
        <button
          onClick={onCreate}
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
            cardCount={cardCountByDeckId[deck.id] ?? 0}
            onClick={() => onOpenDeck(deck.id)}
            onEdit={() => onEdit(deck)}
          />
        ))}
        <div
          onClick={onCreate}
          className="relative aspect-[3/4] rounded-[20px] p-[18px] flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer border-2 border-dashed border-ink-700/20 text-ink-300 hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors"
        >
          <div className="w-[42px] h-[42px] rounded-full bg-current/15 grid place-items-center">
            <Icon name="plus" size={20} />
          </div>
          <div className="font-semibold text-sm">New deck</div>
          <div className="text-xs opacity-80">Group your words</div>
        </div>
      </div>
    </div>
  );
}
