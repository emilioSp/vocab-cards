import { type Deck } from '../types';
import Icon from './Icon';

type DeckCardProps = {
  deck: Deck
  cardCount: number
  onClick: () => void
  onEdit: () => void
}

export default function DeckCard({ deck, cardCount, onClick, onEdit }: DeckCardProps) {
  return (
    <div
      className="relative aspect-[3/4] rounded-[20px] p-[18px] border border-ink-700/10 shadow-soft flex flex-col justify-between cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-16px_rgba(43,29,18,.3)]"
      style={{ background: deck.coverColor }}
      onClick={onClick}
    >
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{ background: 'radial-gradient(80% 60% at 80% 0%, rgba(255,255,255,.5), transparent 60%)' }}
      />
      <div className="flex justify-between items-start relative">
        <span className="text-[32px]">{deck.icon}</span>
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={onEdit}
            title="Edit deck"
            className="w-9 h-9 p-0 rounded-[10px] grid place-items-center bg-white/40 hover:bg-white/60 transition-colors border-0 cursor-pointer text-ink-700"
          >
            <Icon name="edit" size={14} />
          </button>
        </div>
      </div>
      <div className="relative">
        <div className="font-display font-bold text-2xl tracking-tight leading-tight max-w-[90%]">
          {deck.name}
        </div>
        <div className="flex items-center justify-between text-ink-700/70 text-[13px] font-medium mt-2.5">
          <span className="bg-white/55 backdrop-blur-sm px-2.5 py-1 rounded-full">
            {cardCount} {cardCount === 1 ? 'card' : 'cards'}
          </span>
          <span className="inline-flex items-center gap-1">
            Open <Icon name="chevron-r" size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}
