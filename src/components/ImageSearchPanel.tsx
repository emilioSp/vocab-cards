import { useState, useCallback, useRef, useEffect } from 'react';
import { searchImages, downloadImageAsBase64, type OpenverseImage } from '../api/openverse';
import Icon from './Icon';

const INPUT_BASE = 'w-full px-[14px] py-[11px] bg-white border border-ink-700/20 rounded-xl text-ink-700 font-sans transition-all focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15';

type ImageSearchPanelProps = {
  initialQuery?: string
  onSelect: (base64: string) => void
  onClose: () => void
}

export default function ImageSearchPanel({ initialQuery, onSelect, onClose }: ImageSearchPanelProps) {
  const [q, setQ] = useState(initialQuery ?? '');
  const [results, setResults] = useState<OpenverseImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const lastQuery = useRef('');
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed === lastQuery.current) return;
    lastQuery.current = trimmed;
    setLoading(true); setError(null); setResults([]);
    try {
      setResults(await searchImages(trimmed));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach image search.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
    if (initialQuery) doSearch(initialQuery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePick = async (item: OpenverseImage) => {
    const url = item.thumbnail || item.url;
    if (!url) return;
    setPicking(item.id);
    try {
      const base64 = await downloadImageAsBase64(url);
      onSelect(base64);
      onClose();
    } finally {
      setPicking(null);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-ink-700/35 backdrop-blur-[4px] z-[110] grid place-items-center p-6 animate-fadeIn">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-[28px] w-full max-w-[780px] max-h-[90vh] overflow-auto shadow-big animate-pop">
        <div className="px-6 pt-[22px] flex items-start justify-between">
          <div>
            <h3 className="font-display font-bold text-[22px] tracking-tight m-0">Search the web for an image</h3>
            <p className="mt-1.5 text-[13px] text-ink-300">
              Results from Openverse — Creative Commons licensed. Click any image to use it on your card.
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer w-9 h-9 p-0 rounded-[10px] bg-transparent text-ink-500 hover:text-ink-700 hover:bg-ink-700/5 border-0">
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="px-6 py-[18px]">
          <form onSubmit={e => { e.preventDefault(); doSearch(q); }} className="flex gap-2.5">
            <div className="flex-1 relative">
              <Icon name="search" size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: .5 }} />
              <input ref={inputRef} className={`${INPUT_BASE} pl-10`}
                placeholder="Search for an image…" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <button type="submit" disabled={!q.trim() || loading}
              className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm bg-ink-700 text-cream-100 shadow-ink hover:bg-[#1c130b] disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>

          <div className="mt-4 min-h-[280px]">
            {loading && (
              <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-ink-700/5 animate-pulse" />
                ))}
              </div>
            )}
            {error && !loading && (
              <div className="text-center py-12 text-bad-700">
                <div className="font-semibold">Search failed</div>
                <div className="text-[13px] text-ink-300 mt-1">{error}</div>
                <button onClick={() => doSearch(q)}
                  className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-3 py-[7px] rounded-[10px] text-[12.5px] bg-transparent text-ink-700 border border-ink-700/20 hover:bg-ink-700/5 mt-3">
                  Try again
                </button>
              </div>
            )}
            {!loading && !error && results.length === 0 && (
              <div className="text-center py-12 text-ink-300">
                <Icon name="search" size={28} />
                <div className="font-semibold text-ink-500 mt-3">
                  {lastQuery.current ? 'No images found' : 'Type a word and hit Search'}
                </div>
                <div className="text-[13px] mt-1">
                  {lastQuery.current ? 'Try a different keyword.' : 'Results appear here.'}
                </div>
              </div>
            )}
            {!loading && results.length > 0 && (
              <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                {results.map(item => (
                  <button key={item.id} type="button"
                    onClick={() => handlePick(item)}
                    disabled={!!picking}
                    title={item.title}
                    className="relative aspect-square rounded-xl overflow-hidden border border-ink-700/10 cursor-pointer bg-cream-200 group hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-white transition-all disabled:cursor-wait">
                    <img src={item.thumbnail || item.url} alt={item.title || ''}
                      loading="lazy" className="w-full h-full object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }} />
                    {picking === item.id && (
                      <div className="absolute inset-0 grid place-items-center bg-white/80 text-ink-700 text-[11px] font-semibold backdrop-blur-sm">
                        Downloading…
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-700/70 to-transparent text-white text-[10px] font-medium px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-left truncate">
                      {item.title}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pt-2 pb-[18px] flex justify-end">
          <div className="text-[11px] text-ink-300">
            Images via <a href="https://openverse.org" target="_blank" rel="noopener" className="underline">Openverse</a> · downloaded to your card
          </div>
        </div>
      </div>
    </div>
  );
}
