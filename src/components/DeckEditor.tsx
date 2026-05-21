import { useState, useRef, useEffect } from 'react';
import { type Deck } from '../types';
import EmojiPicker from './EmojiPicker';
import Icon from './Icon';

const DECK_COLORS = [
  { name: 'peach',  hex: '#f7c59f' },
  { name: 'sage',   hex: '#bcd4b6' },
  { name: 'lav',    hex: '#d4c5e2' },
  { name: 'sky',    hex: '#bcd6e2' },
  { name: 'butter', hex: '#f4e1a0' },
  { name: 'rose',   hex: '#f0c6c0' },
];

const DEFAULT_EMOJI = '📚';

const INPUT_BASE = 'w-full px-[14px] py-[11px] bg-white border border-ink-700/20 rounded-xl text-ink-700 font-sans transition-all focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15';
const LABEL_CLS = 'text-[11px] font-semibold uppercase tracking-wider text-ink-300';

type DeckEditorProps = {
  deck: Partial<Deck>          // empty object = new deck
  existingNames: string[]
  onClose: () => void
  onSave: (name: string, coverColor: string, icon: string) => void
  onDelete?: () => void
}

export default function DeckEditor({ deck, existingNames, onClose, onSave, onDelete }: DeckEditorProps) {
  const isNew = !deck.id;
  const [name, setName]   = useState(deck.name ?? '');
  const [color, setColor] = useState(deck.coverColor ?? DECK_COLORS[0].hex);
  const [emoji, setEmoji] = useState(deck.icon ?? DEFAULT_EMOJI);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const dupName = existingNames.some(n =>
    n.toLowerCase() === name.trim().toLowerCase() &&
    n.toLowerCase() !== (deck.name ?? '').toLowerCase(),
  );
  const canSave = name.trim().length > 0 && !dupName;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave(name.trim(), color, emoji);
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-ink-700/35 backdrop-blur-[4px] z-[100] grid place-items-center p-6 animate-fadeIn">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[28px] w-full max-w-[560px] max-h-[90vh] overflow-auto shadow-big animate-pop">
        <form onSubmit={submit}>
          <div className="px-6 pt-[22px] flex items-start justify-between">
            <div>
              <h3 className="font-display font-bold text-[22px] tracking-tight m-0">{isNew ? 'New deck' : 'Edit deck'}</h3>
              <p className="mt-1.5 text-[13px] text-ink-300">A deck groups vocabulary cards by topic, level, or theme.</p>
            </div>
            <button type="button" onClick={onClose}
              className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer w-9 h-9 p-0 rounded-[10px] bg-transparent text-ink-500 hover:text-ink-700 hover:bg-ink-700/5 border-0">
              <Icon name="close" size={16} />
            </button>
          </div>

          <div className="px-6 py-[18px] flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLS}>Deck name</label>
              <input ref={inputRef} className={INPUT_BASE}
                value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Kitchen essentials" maxLength={48} />
              {dupName && <small className="text-bad-700 text-xs">A deck with this name already exists.</small>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLS}>Cover color</label>
              <div className="flex gap-2 flex-wrap">
                {DECK_COLORS.map(c => (
                  <button key={c.name} type="button"
                    onClick={() => setColor(c.hex)} aria-label={c.name}
                    style={{ background: c.hex }}
                    className={`w-8 h-8 rounded-[10px] cursor-pointer border-2 transition-transform shadow-[0_1px_0_rgba(255,255,255,.5)_inset,0_1px_3px_rgba(43,29,18,.15)] ${
                      color === c.hex ? 'border-ink-700 scale-[1.06]' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>

          <div className="px-6 pt-3.5 pb-[22px] flex justify-between gap-2.5 items-center">
            {!isNew && onDelete ? (
              <button type="button"
                onClick={onDelete}
                className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-3 py-[7px] rounded-[10px] text-[12.5px] bg-transparent text-bad-700 border border-bad/30 hover:bg-bad/10">
                <Icon name="trash" size={14} /> Delete deck
              </button>
            ) : <div />}
            <div className="flex gap-2.5">
              <button type="button" onClick={onClose}
                className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm bg-transparent text-ink-700 border border-ink-700/20 hover:bg-ink-700/5">
                Cancel
              </button>
              <button type="submit" disabled={!canSave}
                className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm bg-ink-700 text-cream-100 shadow-ink hover:bg-[#1c130b] disabled:opacity-40 disabled:cursor-not-allowed">
                {isNew ? 'Create deck' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
