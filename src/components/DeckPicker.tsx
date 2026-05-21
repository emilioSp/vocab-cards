import { useState } from 'react';
import { type Deck } from '../types';
import Icon from './Icon';

const VIRTUAL_DECKS: Deck[] = [
  { id: '__all__',    name: 'All cards',  icon: '🗂️', coverColor: 'linear-gradient(135deg,#f7c59f,#bcd4b6,#d4c5e2)' },
  { id: '__random__', name: 'Random mix', icon: '🎲', coverColor: 'linear-gradient(135deg,#bcd6e2,#f4e1a0,#f0c6c0)' },
];

export { VIRTUAL_DECKS };

type DeckPickerProps = {
  currentDeck: Deck
  allDecks: Deck[]
  onPick: (id: string) => void
}

export default function DeckPicker({ currentDeck, allDecks, onPick }: DeckPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(s => !s)}
        className="inline-flex items-center gap-2.5 py-2 pl-4 pr-2 rounded-full bg-white border border-ink-700/10 font-semibold text-sm cursor-pointer hover:bg-cream-200/50 transition-colors"
      >
        <span className="w-[18px] h-[18px] rounded-md" style={{ background: currentDeck.coverColor }} />
        <span>{currentDeck.icon} {currentDeck.name}</span>
        <Icon name="chevron-r" size={14} style={{ transform: 'rotate(90deg)', opacity: .6 }} />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-[5]" />
          <div className="absolute top-[calc(100%+6px)] left-0 z-[6] bg-white rounded-[14px] border border-ink-700/10 shadow-big p-1.5 min-w-[260px]">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-300 px-2.5 pt-2 pb-1">Mixed practice</div>
            {VIRTUAL_DECKS.map(d => (
              <button key={d.id} onClick={() => { onPick(d.id); setOpen(false); }}
                className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[10px] border-0 cursor-pointer font-semibold text-[13px] text-ink-700 text-left ${d.id === currentDeck.id ? 'bg-accent/10' : 'bg-transparent hover:bg-ink-700/[.04]'}`}>
                <span className="w-3.5 h-3.5 rounded-md" style={{ background: d.coverColor }} />
                <span className="flex-1">{d.icon} {d.name}</span>
                {d.id === '__random__' && <span className="text-[10px] text-ink-300 font-medium">surprise</span>}
              </button>
            ))}
            <div className="h-px bg-ink-700/10 mx-1 my-1.5" />
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-300 px-2.5 pt-2 pb-1">Your decks</div>
            {allDecks.map(d => (
              <button key={d.id} onClick={() => { onPick(d.id); setOpen(false); }}
                className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[10px] border-0 cursor-pointer font-semibold text-[13px] text-ink-700 text-left ${d.id === currentDeck.id ? 'bg-accent/10' : 'bg-transparent hover:bg-ink-700/[.04]'}`}>
                <span className="w-3.5 h-3.5 rounded-md" style={{ background: d.coverColor }} />
                <span className="flex-1">{d.icon} {d.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
