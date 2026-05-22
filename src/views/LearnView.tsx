import { type Deck, type CardData } from '../types';
import { useCards } from '../hooks/useCards';
import { useModalManager } from '../hooks/useModalManager';
import { useLearnSession } from '../hooks/useLearnSession';
import CardEditor from '../components/CardEditor';
import FlashCard from '../components/FlashCard';
import DeckPicker from '../components/DeckPicker';
import SessionCompleteView from './SessionCompleteView';
import Icon from '../components/Icon';

function speak(text: string) {
  if (!('speechSynthesis' in window) || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

type VerdictBtnProps = {
  variant: 'up' | 'down' | 'skip' | 'back'
  hint: string
  title: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

function VerdictBtn({ variant, hint, title, disabled, onClick, children }: VerdictBtnProps) {
  const base = 'appearance-none border-0 cursor-pointer grid place-items-center shrink-0 transition-all duration-150 shadow-[0_1px_0_rgba(255,255,255,.4)_inset,0_8px_24px_-8px_rgba(43,29,18,.3)] hover:-translate-y-0.5 hover:scale-[1.04] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100';
  const sizes: Record<string, string> = {
    up:   'w-[68px] h-[68px] rounded-full bg-good/25 text-good-700 hover:bg-good/40',
    down: 'w-[68px] h-[68px] rounded-full bg-bad/15 text-bad-700 hover:bg-bad/25',
    skip: 'w-12 h-12 rounded-full bg-white border border-ink-700/10 text-ink-500 hover:bg-cream-200 hover:scale-100',
    back: 'w-12 h-12 rounded-full bg-white border border-ink-700/10 text-ink-500 hover:bg-cream-200 hover:scale-100',
  };
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button onClick={onClick} title={title} disabled={disabled} className={`${base} ${sizes[variant]}`}>
        {children}
      </button>
      <span className="font-mono text-[10px] px-1.5 py-px border border-ink-700/20 rounded bg-white text-ink-300 mt-1.5">
        {hint}
      </span>
    </div>
  );
}

type LearnViewProps = {
  deck: Deck
  allDecks: Deck[]
  onPickDeck: (id: string) => void
  onExit: () => void
}

export default function LearnView({ deck, allDecks, onPickDeck, onExit }: LearnViewProps) {
  const { cards, updateCard, loading } = useCards(deck.id);
  const { cardEditor, openEditCard, closeCardEditor } = useModalManager();
  const session = useLearnSession(cards);
  const { currentCard, idx, total, flipped, streak, reviewed, done, flip, score, skip, goBack, restart } = session;

  const handleSaveCard = async (data: Omit<CardData, 'score'>) => {
    if (cardEditor?.id) await updateCard(cardEditor.id, data);
    closeCardEditor();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center font-sans text-ink-300">
        Loading…
      </div>
    );
  }

  if (done) {
    return <SessionCompleteView deck={deck} reviewed={reviewed} onRestart={restart} onExit={onExit} />;
  }

  if (!currentCard) {
    return (
      <div className="flex-1 flex flex-col items-center px-7 py-6 gap-5">
        <div className="text-center py-16 px-5 max-w-[520px]">
          <h2 className="font-display font-bold text-[42px] tracking-tight m-0 mb-3">This deck has no cards yet</h2>
          <p className="text-ink-500 text-base m-0 mb-6">Add some cards before starting a learning session.</p>
          <button onClick={onExit}
            className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm bg-accent text-white shadow-accent hover:bg-accent-600">
            <Icon name="plus" size={14} /> Manage cards
          </button>
        </div>
      </div>
    );
  }

  const pct = Math.round((idx / total) * 100);

  return (
    <div className="flex-1 grid grid-rows-[auto_1fr_auto_auto] px-7 pt-6 pb-8 gap-y-5 min-h-0 w-full">
      {/* Row 1: Header */}
      <div className="w-full max-w-[720px] mx-auto flex items-center justify-between gap-5">
        <DeckPicker currentDeck={deck} allDecks={allDecks} onPick={onPickDeck} />
        <div className="flex-1 max-w-[380px] flex flex-col gap-1.5">
          <div className="h-2 bg-ink-700/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #e07a5f, #f5b399)' }} />
          </div>
          <div className="flex justify-between text-xs text-ink-300 tabular-nums">
            <span>Card {idx + 1} of {total}</span>
            <span>{pct}%</span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-ink-700/10 font-semibold text-sm" title="Streak: consecutive thumbs-ups">
          <span style={{ color: streak > 0 ? '#e07a5f' : '#9a8a78', filter: 'drop-shadow(0 1px 2px rgba(224,122,95,.3))' }}>
            <Icon name="flame" size={16} />
          </span>
          {streak}
        </div>
      </div>

      {/* Row 2: Flashcard */}
      <div className="flex items-center justify-center min-h-0">
        <FlashCard
          card={currentCard}
          flipped={flipped}
          flashClass=""
          onClick={flip}
          onSpeak={speak}
        />
      </div>

      {/* Row 3: Verdict buttons */}
      <div className="flex gap-3.5 items-center justify-center">
        <VerdictBtn variant="down" hint="↓" title="Thumbs down (↓)" onClick={() => score(-1)}>
          <Icon name="thumb-down" size={28} />
        </VerdictBtn>
        <VerdictBtn variant="back" hint="←" title="Previous card (←)" disabled={idx === 0} onClick={goBack}>
          <Icon name="arrow-l" size={20} />
        </VerdictBtn>
        <VerdictBtn variant="skip" hint="→" title="Skip (→)" onClick={skip}>
          <Icon name="skip" size={20} />
        </VerdictBtn>
        <VerdictBtn variant="up" hint="↑" title="Thumbs up (↑)" onClick={() => score(1)}>
          <Icon name="thumb-up" size={28} />
        </VerdictBtn>
      </div>

      {/* Row 4: Bottom CTAs */}
      <div className="flex gap-2 text-ink-300 text-xs justify-center">
        <button onClick={() => openEditCard(currentCard)}
          className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-3 py-[7px] rounded-[10px] text-[12.5px] bg-transparent text-ink-500 hover:text-ink-700 hover:bg-ink-700/5 border-0">
          <Icon name="edit" size={13} /> Edit this card
        </button>
        <button onClick={onExit}
          className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-3 py-[7px] rounded-[10px] text-[12.5px] bg-transparent text-ink-500 hover:text-ink-700 hover:bg-ink-700/5 border-0">
          <Icon name="folder" size={13} /> Manage decks
        </button>
      </div>

      {cardEditor !== null && (
        <CardEditor
          card={cardEditor}
          existingWords={cards.map(c => c.word)}
          onClose={closeCardEditor}
          onSave={handleSaveCard}
        />
      )}
    </div>
  );
}
