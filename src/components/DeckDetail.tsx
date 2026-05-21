import { useState, useMemo } from 'react';
import { type Deck, type Card } from '../types';
import CardTile from './CardTile';
import Icon from './Icon';

type DeckDetailProps = {
  deck: Deck
  cards: Card[]
  onBack: () => void
  onStartLearn: () => void
  onEditDeck: () => void
  onDeleteDeck: () => void
  onCreateCard: () => void
  onEditCard: (card: Card) => void
  onDeleteCard: (card: Card) => void
  onScoreCard: (card: Card, delta: number) => void
}

export default function DeckDetail({
  deck, cards, onBack, onStartLearn, onEditDeck, onDeleteDeck,
  onCreateCard, onEditCard, onDeleteCard, onScoreCard,
}: DeckDetailProps) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q.trim()) return cards;
    const k = q.toLowerCase();
    return cards.filter(c =>
      c.word.toLowerCase().includes(k) ||
      c.translation.toLowerCase().includes(k) ||
      (c.sampleSentence ?? '').toLowerCase().includes(k),
    );
  }, [q, cards]);

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
            onClick={onEditDeck}
            className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-3 py-[7px] rounded-[10px] text-[12.5px] bg-transparent text-ink-700 border border-ink-700/20 hover:bg-ink-700/5"
          >
            <Icon name="edit" size={14} /> Edit deck
          </button>
          <button
            onClick={onDeleteDeck}
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
            onClick={onCreateCard}
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
              onEdit={() => onEditCard(card)}
              onDelete={() => onDeleteCard(card)}
              onScore={delta => onScoreCard(card, delta)}
            />
          ))}
          <div
            onClick={onCreateCard}
            className="border-2 border-dashed border-ink-700/20 bg-transparent flex flex-col items-center justify-center text-center cursor-pointer min-h-[240px] text-ink-300 gap-2.5 p-[18px] rounded-[14px] hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-ink-700/[.08] grid place-items-center">
              <Icon name="plus" size={20} />
            </div>
            <div className="font-semibold text-sm">Add card</div>
          </div>
        </div>
      )}
    </div>
  );
}
