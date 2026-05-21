import { searchSentencesFallback } from './freeDictionary';

export type SentenceResult = {
  text: string
  translation?: string
}

export async function searchSentences(word: string): Promise<SentenceResult[]> {
  // 1. Try Tatoeba (eng → ita)
  try {
    const url = `https://tatoeba.org/en/api_v0/search?query=${encodeURIComponent(word)}&from=eng&to=ita&orphans=no&sort=relevance`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('tatoeba error');
    const data = await res.json();
    const items: SentenceResult[] = (data.results ?? [])
      .slice(0, 12)
      .map((s: { text: string; translations?: { lang: string; text: string }[][] }) => ({
        text: s.text,
        translation: (s.translations ?? []).flat().find(t => t.lang === 'ita')?.text,
      }));
    if (items.length > 0) return items;
  } catch {
    // fall through to Free Dictionary fallback
  }

  // 2. Fallback: Free Dictionary API
  return searchSentencesFallback(word);
}
