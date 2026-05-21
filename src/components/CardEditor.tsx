import { useState, useRef, useEffect } from 'react';
import { type Card, type CardData } from '../types';
import ImageSearchPanel from './ImageSearchPanel';
import SentenceSearchPanel from './SentenceSearchPanel';
import Icon from './Icon';

const INPUT_BASE = 'w-full px-[14px] py-[11px] bg-white border border-ink-700/20 rounded-xl text-ink-700 font-sans transition-all focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15';
const LABEL_CLS = 'text-[11px] font-semibold uppercase tracking-wider text-ink-300';

type CardEditorProps = {
  card: Partial<Card> & { deckId: string }
  existingWords: string[]
  onClose: () => void
  onSave: (data: Omit<CardData, 'score'>) => void
  onDelete?: () => void
}

export default function CardEditor({ card, existingWords, onClose, onSave, onDelete }: CardEditorProps) {
  const isNew = !card.id;
  const [word, setWord]         = useState(card.word ?? '');
  const [translation, setTrans] = useState(card.translation ?? '');
  const [sentence, setSentence] = useState(card.sampleSentence ?? '');
  const [image, setImage]       = useState(card.imgBase64 ?? '');
  const [imageOpen, setImageOpen]       = useState(false);
  const [sentenceOpen, setSentenceOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const dup = existingWords.some(w =>
    w.toLowerCase() === word.trim().toLowerCase() &&
    w.toLowerCase() !== (card.word ?? '').toLowerCase(),
  );
  const canSave = word.trim().length > 0 && translation.trim().length > 0 && !dup;

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({ word: word.trim(), translation: translation.trim(), sampleSentence: sentence.trim(), imgBase64: image || undefined });
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-ink-700/35 backdrop-blur-[4px] z-[100] grid place-items-center p-6 animate-fadeIn">
        <div onClick={e => e.stopPropagation()} className="bg-white rounded-[28px] w-full max-w-[640px] max-h-[90vh] overflow-auto shadow-big animate-pop">
          <form onSubmit={submit}>
            <div className="px-6 pt-[22px] flex items-start justify-between">
              <div>
                <h3 className="font-display font-bold text-[22px] tracking-tight m-0">{isNew ? 'New card' : 'Edit card'}</h3>
                <p className="mt-1.5 text-[13px] text-ink-300">An image, the English word, the Italian translation, and a sample sentence.</p>
              </div>
              <button type="button" onClick={onClose}
                className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer w-9 h-9 p-0 rounded-[10px] bg-transparent text-ink-500 hover:text-ink-700 hover:bg-ink-700/5 border-0">
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="px-6 py-[18px] grid gap-[18px]" style={{ gridTemplateColumns: '1fr 1.1fr' }}>
              {/* Image slot */}
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLS}>Image</label>
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
                  onClick={() => fileInput.current?.click()}
                  style={{
                    backgroundImage: image
                      ? `url(${image})`
                      : 'repeating-linear-gradient(45deg, rgba(43,29,18,.06), rgba(43,29,18,.06) 8px, transparent 8px, transparent 16px)',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }}
                  className="aspect-square rounded-[14px] cursor-pointer border-2 border-dashed border-ink-700/20 bg-cream-200 grid place-items-center text-center text-ink-300 relative overflow-hidden"
                >
                  {!image && (
                    <div className="p-4">
                      <Icon name="plus" size={22} />
                      <div className="font-semibold text-ink-500 mt-1.5 text-[13px]">Drop an image</div>
                      <div className="text-[11px] mt-0.5">or click to browse</div>
                    </div>
                  )}
                  {image && (
                    <button type="button"
                      onClick={e => { e.stopPropagation(); setImage(''); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg border-0 cursor-pointer bg-ink-700/75 text-white grid place-items-center backdrop-blur-md">
                      <Icon name="close" size={14} />
                    </button>
                  )}
                  <input ref={fileInput} type="file" accept="image/*" className="hidden"
                    onChange={e => handleFile(e.target.files?.[0])} />
                </div>
                <button type="button"
                  onClick={e => { e.stopPropagation(); setImageOpen(true); }}
                  disabled={!word.trim()}
                  className="mt-1.5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-ink-700/15 bg-white text-ink-700 text-[13px] font-semibold cursor-pointer hover:bg-cream-200 hover:border-ink-700/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Icon name="search" size={14} /> Search the web for an image
                </button>
                {!word.trim() && (
                  <small className="text-[11px] text-ink-300 text-center">Type the English word first to search.</small>
                )}
              </div>

              {/* Text fields */}
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className={LABEL_CLS}>English word</label>
                  <input ref={inputRef} className={INPUT_BASE}
                    value={word} onChange={e => setWord(e.target.value)}
                    placeholder="apple" maxLength={48} />
                  {dup && <small className="text-bad-700 text-xs">This word already exists in the deck.</small>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={LABEL_CLS}>Italian translation</label>
                  <input className={INPUT_BASE}
                    value={translation} onChange={e => setTrans(e.target.value)}
                    placeholder="mela" maxLength={64} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={LABEL_CLS}>Sample sentence (English)</label>
                  <textarea value={sentence} onChange={e => setSentence(e.target.value)}
                    placeholder="I eat an apple every morning." maxLength={240}
                    className={`${INPUT_BASE} min-h-[74px] resize-y leading-snug`} />
                  <div className="flex items-center justify-between gap-2">
                    <small className="text-[11px] text-ink-300">
                      Tip: surround the word with *asterisks* to highlight it.
                    </small>
                    <button type="button"
                      onClick={() => setSentenceOpen(true)}
                      disabled={!word.trim()}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-500 hover:text-accent-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-transparent border-0 px-2 py-1 rounded-md hover:bg-accent/5 transition-colors">
                      <Icon name="search" size={12} /> Search the web for a sentence
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pt-3.5 pb-[22px] flex justify-between gap-2.5 items-center">
              {!isNew && onDelete ? (
                <button type="button" onClick={onDelete}
                  className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-3 py-[7px] rounded-[10px] text-[12.5px] bg-transparent text-bad-700 border border-bad/30 hover:bg-bad/10">
                  <Icon name="trash" size={14} /> Delete
                </button>
              ) : <div />}
              <div className="flex gap-2.5">
                <button type="button" onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm bg-transparent text-ink-700 border border-ink-700/20 hover:bg-ink-700/5">
                  Cancel
                </button>
                <button type="submit" disabled={!canSave}
                  className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm bg-ink-700 text-cream-100 shadow-ink hover:bg-[#1c130b] disabled:opacity-40 disabled:cursor-not-allowed">
                  {isNew ? 'Add card' : 'Save changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {imageOpen && (
        <ImageSearchPanel
          initialQuery={word.trim()}
          onSelect={img => setImage(img)}
          onClose={() => setImageOpen(false)}
        />
      )}
      {sentenceOpen && (
        <SentenceSearchPanel
          word={word.trim()}
          onSelect={s => setSentence(s)}
          onClose={() => setSentenceOpen(false)}
        />
      )}
    </>
  );
}
