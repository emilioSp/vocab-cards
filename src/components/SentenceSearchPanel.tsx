import { useState, useEffect, useCallback } from 'react';
import { searchSentences, type SentenceResult } from '../api/tatoeba';
import Icon from './Icon';

type SentenceSearchPanelProps = {
  word: string
  onSelect: (sentence: string) => void
  onClose: () => void
}

export default function SentenceSearchPanel({ word, onSelect, onClose }: SentenceSearchPanelProps) {
  const [corpus, setCorpus] = useState<SentenceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState('');

  const fetchCorpus = useCallback(async () => {
    if (!word) return;
    setLoading(true); setError(null); setCorpus([]); setSource('');
    try {
      const results = await searchSentences(word);
      setCorpus(results);
      setSource(results.some(r => r.translation) ? 'tatoeba' : 'dictionary');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach the sentence corpus.');
    } finally {
      setLoading(false);
    }
  }, [word]);

  useEffect(() => { fetchCorpus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div onClick={onClose} className="fixed inset-0 bg-ink-700/35 backdrop-blur-[4px] z-[110] grid place-items-center p-6 animate-fadeIn">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[28px] w-full max-w-[680px] max-h-[90vh] overflow-auto shadow-big animate-pop">
        <div className="px-6 pt-[22px] flex items-start justify-between">
          <div>
            <h3 className="font-display font-bold text-[22px] tracking-tight m-0">
              Sentences using "{word}"
            </h3>
            <p className="mt-1.5 text-[13px] text-ink-300">
              Click any sentence to add it to the card.
              {source && <span className="ml-1">Source: <strong>{source === 'tatoeba' ? 'Tatoeba' : 'Wiktionary'}</strong></span>}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer w-9 h-9 p-0 rounded-[10px] bg-transparent text-ink-500 hover:text-ink-700 hover:bg-ink-700/5 border-0">
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="px-6 py-[18px]">
          <div className="flex items-center justify-end mb-2.5">
            <button type="button" onClick={fetchCorpus} disabled={loading}
              className="text-ink-500 hover:text-ink-700 text-xs font-medium flex items-center gap-1 cursor-pointer bg-transparent border-0 disabled:opacity-50">
              <Icon name="rotate" size={11} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[58px] rounded-xl bg-ink-700/5 animate-pulse" />
              ))}
            </div>
          ) : corpus.length > 0 ? (
            <div className="space-y-2">
              {corpus.map((s, i) => (
                <button key={i} type="button" onClick={() => { onSelect(s.text); onClose(); }}
                  className="text-left w-full p-3.5 rounded-xl border border-ink-700/10 bg-white hover:border-accent hover:bg-accent/5 hover:shadow-soft transition-all cursor-pointer">
                  <div className="text-[15px] text-ink-700 leading-snug">{s.text}</div>
                  {s.translation && (
                    <div className="text-[13px] text-ink-300 mt-1.5 italic">{s.translation}</div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-ink-300">
              <Icon name="search" size={28} />
              <div className="font-semibold text-ink-500 mt-3">{error ?? 'No examples available.'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
