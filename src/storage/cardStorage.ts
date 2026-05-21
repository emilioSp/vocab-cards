import {
  readDir,
  readTextFile,
  writeTextFile,
  remove,
} from '@tauri-apps/plugin-fs';
import { v7 as uuidv7 } from 'uuid';
import { type Card, type CardData } from '../types';
import { slugify } from './slugify';
import { deckDir, cardFilePath } from './paths';

export async function listCards(deckId: string): Promise<Card[]> {
  const dir = await deckDir(deckId);
  const entries = await readDir(dir);
  const cards: Card[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    if (!entry.name.endsWith('.json')) continue;
    if (entry.name === '.config.json') continue;

    const id = entry.name.replace(/\.json$/, '');
    try {
      const raw = await readTextFile(await cardFilePath(deckId, id));
      const data: CardData = JSON.parse(raw);
      cards.push({ id, deckId, ...data });
    } catch {
      // Skip unreadable files
    }
  }

  return cards.sort((a, b) => a.word.localeCompare(b.word));
}

export async function createCard(
  deckId: string,
  data: Omit<CardData, 'score'>,
): Promise<Card> {
  const id = `${uuidv7()}-${slugify(data.word)}`;
  const cardData: CardData = { ...data, score: 0 };
  await writeTextFile(await cardFilePath(deckId, id), JSON.stringify(cardData, null, 2));
  return { id, deckId, ...cardData };
}

export async function updateCard(
  deckId: string,
  cardId: string,
  data: Partial<CardData>,
): Promise<Card> {
  const filePath = await cardFilePath(deckId, cardId);
  const existing: CardData = JSON.parse(await readTextFile(filePath));
  const updated: CardData = { ...existing, ...data };
  await writeTextFile(filePath, JSON.stringify(updated, null, 2));
  return { id: cardId, deckId, ...updated };
}

export async function deleteCard(deckId: string, cardId: string): Promise<void> {
  await remove(await cardFilePath(deckId, cardId));
}
