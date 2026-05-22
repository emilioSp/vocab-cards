import { type Deck } from '../types';
import { type AppMode } from '../hooks/useViewManager';
import Icon from './Icon';

type TopBarProps = {
  mode: AppMode
  onModeChange: (mode: AppMode) => void
  canLearn: boolean
  decks: Deck[]
}

export default function TopBar({ mode, onModeChange, canLearn, decks }: TopBarProps) {
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
