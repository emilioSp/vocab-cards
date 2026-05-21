import { type Card } from '../types';
import Icon from './Icon';

type HighlightedSentenceProps = { text: string; word: string }

function HighlightedSentence({ text, word }: HighlightedSentenceProps) {
  if (!text) return <span className="text-ink-300 italic">No sample sentence.</span>;
  if (text.includes('*')) {
    const parts = text.split(/(\*[^*]+\*)/g);
    return (
      <>
        {parts.map((p, i) =>
          p.startsWith('*') && p.endsWith('*')
            ? <em key={i}>{p.slice(1, -1)}</em>
            : <span key={i}>{p}</span>,
        )}
      </>
    );
  }
  if (word) {
    const re = new RegExp(`(\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b)`, 'i');
    const parts = text.split(re);
    return (
      <>
        {parts.map((p, i) =>
          re.test(p) ? <em key={i}>{p}</em> : <span key={i}>{p}</span>,
        )}
      </>
    );
  }
  return <span>{text}</span>;
}

type FlashCardProps = {
  card: Card
  flipped: boolean
  flashClass: string
  onClick: () => void
  onSpeak: (text: string) => void
}

export default function FlashCard({ card, flipped, flashClass, onClick, onSpeak }: FlashCardProps) {
  return (
    <div
      className="w-full max-w-[520px] h-full perspective-card"
      style={{ maxHeight: 'min(720px, calc(100vh - 300px))' }}
      onClick={onClick}
    >
      <div
        className={`w-full h-full relative preserve-3d transition-transform duration-[600ms] cursor-pointer ${flipped ? 'rotate-y-180' : ''} ${flashClass}`}
        style={{ transitionTimingFunction: 'cubic-bezier(.4,.2,.2,1)' }}
      >
        {/* FRONT */}
        <div className="absolute inset-0 backface-hidden bg-white rounded-[24px] shadow-big border border-ink-700/10 flex flex-col p-5 overflow-hidden">
          <div className={`flex-1 min-h-0 rounded-2xl overflow-hidden relative grid place-items-center ${card.imgBase64 ? 'bg-cream-100' : 'bg-stripes bg-cream-200'}`}>
            {card.imgBase64
              ? <img src={card.imgBase64} alt={card.word} className="max-w-full max-h-full w-auto h-auto object-contain" />
              : <div className="text-ink-300 font-mono text-xs">no image</div>}
          </div>
          <div className="font-display font-bold tracking-tight leading-none mt-3.5" style={{ fontSize: 'clamp(28px, 4.4vw, 42px)' }}>
            {card.word}
            <button
              onClick={e => { e.stopPropagation(); onSpeak(card.word); }}
              title="Speak (S)"
              className="ml-2 align-middle bg-transparent border-0 cursor-pointer p-1.5 rounded-lg text-ink-300 hover:text-accent hover:bg-accent/5"
            >
              <Icon name="sound" size={18} />
            </button>
          </div>
          <div className="text-[12.5px] text-ink-300 mt-2.5 flex items-center gap-1.5">
            <Icon name="rotate" size={12} /> Click or press
            <span className="font-mono text-[10px] px-1.5 py-px border border-ink-700/20 rounded bg-white">Space</span>
            to flip
          </div>
        </div>

        {/* BACK */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-[24px] shadow-big border border-ink-700/10 flex flex-col justify-start p-5 overflow-hidden">
          <div className="text-[11px] tracking-widest uppercase text-ink-300 mb-1.5">Italian</div>
          <div className="font-display font-bold tracking-tight leading-none text-accent-600" style={{ fontSize: 'clamp(28px, 4.4vw, 42px)' }}>
            {card.translation}
          </div>
          <>
            <div className="h-px bg-ink-700/10 my-5" />
            <div className="text-[11px] tracking-widest uppercase text-ink-300 mb-1.5">In context</div>
            <div className="text-[17px] leading-snug text-ink-700 sentence-hl">
              <HighlightedSentence text={card.sampleSentence ?? ''} word={card.word} />
            </div>
          </>
          <div className="mt-auto pt-4 flex items-center gap-2.5">
            <div className="w-[60px] h-[60px] rounded-xl bg-cream-200 bg-stripes overflow-hidden shrink-0">
              {card.imgBase64 && <img src={card.imgBase64} alt={card.word} className="w-full h-full object-cover" />}
            </div>
            <div className="text-sm text-ink-300">
              <strong className="font-display font-bold text-ink-700 text-xl tracking-tight block">{card.word}</strong>
              English
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
