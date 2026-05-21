import { type SentenceResult } from './tatoeba';

export async function searchSentencesFallback(word: string): Promise<SentenceResult[]> {
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
  );
  if (!res.ok) throw new Error('No sentences found for this word.');
  const entries = await res.json();

  const items: SentenceResult[] = [];
  for (const entry of (Array.isArray(entries) ? entries : [])) {
    for (const meaning of (entry.meanings ?? [])) {
      for (const def of (meaning.definitions ?? [])) {
        if (def.example) items.push({ text: def.example });
      }
    }
  }

  if (items.length === 0) throw new Error('No example sentences found for this word.');
  return items.slice(0, 12);
}
