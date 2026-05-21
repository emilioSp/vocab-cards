import { type Deck } from '../types';
import Icon from '../components/Icon';

type SessionCompleteViewProps = {
  deck: Deck
  reviewed: { good: number; bad: number; skipped: number }
  onRestart: () => void
  onExit: () => void
}

function Stat({ num, label, tone }: { num: number; label: string; tone?: 'good' | 'bad' }) {
  const c = tone === 'good' ? 'text-good-700' : tone === 'bad' ? 'text-bad-700' : 'text-ink-700';
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`font-display font-bold text-[38px] tracking-tight leading-none ${c}`}>{num}</span>
      <span className="text-xs text-ink-300 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function SessionCompleteView({ deck, reviewed, onRestart, onExit }: SessionCompleteViewProps) {
  const total = reviewed.good + reviewed.bad + reviewed.skipped;
  return (
    <div className="flex-1 flex flex-col items-center px-7 py-6 gap-5">
      <div className="text-center py-16 px-5 max-w-[520px]">
        <div className="text-[60px] mb-1.5">🎉</div>
        <h2 className="font-display font-bold text-[42px] tracking-tight m-0 mb-3">Session complete</h2>
        <p className="text-ink-500 text-base m-0 mb-6">
          You went through {total} {total === 1 ? 'card' : 'cards'} in <strong>{deck.name}</strong>.
        </p>
        <div className="flex justify-center gap-8 my-6 mb-7">
          <Stat num={reviewed.good}    label="Got it"  tone="good" />
          <Stat num={reviewed.bad}     label="Missed"  tone="bad" />
          <Stat num={reviewed.skipped} label="Skipped" />
        </div>
        <div className="flex gap-2.5 justify-center">
          <button
            onClick={onExit}
            className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm bg-transparent text-ink-700 border border-ink-700/20 hover:bg-ink-700/5"
          >
            <Icon name="folder" size={14} /> Manage decks
          </button>
          <button
            onClick={onRestart}
            className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm bg-accent text-white shadow-accent hover:bg-accent-600"
          >
            <Icon name="rotate" size={14} /> Practice again
          </button>
        </div>
      </div>
    </div>
  );
}
