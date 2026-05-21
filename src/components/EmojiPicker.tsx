import { useState, useMemo } from 'react';
import { DECK_EMOJI_LABELS } from '../assets/emojis';
import Icon from './Icon';

type EmojiPickerProps = {
  value: string
  onChange: (emoji: string) => void
}

const INPUT_BASE = 'w-full px-[14px] py-[11px] bg-white border border-ink-700/20 rounded-xl text-ink-700 font-sans transition-all focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15';
const LABEL_CLS = 'text-[11px] font-semibold uppercase tracking-wider text-ink-300';

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [query, setQuery] = useState('');

  const entries = useMemo(() => Object.entries(DECK_EMOJI_LABELS), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    const direct = entries.filter(([, v]) => v === query);
    if (direct.length) return direct;
    return entries.filter(([name]) => name.toLowerCase().includes(q));
  }, [query, entries]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className={LABEL_CLS}>Icon</label>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-cream-200 border border-ink-700/10 grid place-items-center text-[26px] leading-none shrink-0">
          {value}
        </div>
        <div className="flex-1 relative">
          <Icon name="search" size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: .5 }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search icons — e.g. apple, book, heart…"
            className={`${INPUT_BASE} pl-10`}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md grid place-items-center text-ink-300 hover:bg-ink-700/5 hover:text-ink-700 cursor-pointer bg-transparent border-0">
              <Icon name="close" size={12} />
            </button>
          )}
        </div>
      </div>
      <div
        className="grid gap-1 max-h-[200px] overflow-y-auto p-2 bg-cream-100 rounded-xl border border-ink-700/10 mt-1 min-h-[60px]"
        style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}
      >
        {filtered.length === 0 ? (
          <div className="col-span-12 text-center text-[12px] text-ink-300 py-3">
            No icons match "{query}".
          </div>
        ) : filtered.map(([name, emoji], i) => (
          <button
            key={`${emoji}-${i}`}
            type="button"
            onClick={() => onChange(emoji)}
            title={name}
            className={`w-7 h-7 rounded-md text-[18px] leading-none cursor-pointer border-0 transition-colors ${
              value === emoji ? 'bg-ink-700/15 ring-1 ring-ink-700' : 'bg-transparent hover:bg-ink-700/10'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <small className="text-[11px] text-ink-300">
        {query
          ? `${filtered.length.toLocaleString()} of ${entries.length.toLocaleString()} icons`
          : `${entries.length.toLocaleString()} icons · hover for description`}
      </small>
    </div>
  );
}
