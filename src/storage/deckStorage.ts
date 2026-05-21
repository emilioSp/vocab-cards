import {
  readDir,
  readTextFile,
  writeTextFile,
  mkdir,
  remove,
  rename,
  exists,
} from '@tauri-apps/plugin-fs';
import { type Deck, type DeckConfig } from '../types';
import { slugify } from './slugify';
import { decksRoot, deckDir, deckConfigPath } from './paths';

export async function ensureDecksRoot(): Promise<void> {
  const root = await decksRoot();
  if (!(await exists(root))) {
    await mkdir(root, { recursive: true });
  }
}

export async function listDecks(): Promise<Deck[]> {
  await ensureDecksRoot();
  const root = await decksRoot();
  const entries = await readDir(root);
  const decks: Deck[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory) continue;
    const id = entry.name;
    try {
      const configPath = await deckConfigPath(id);
      const raw = await readTextFile(configPath);
      const config: DeckConfig = JSON.parse(raw);
      decks.push({ id, ...config });
    } catch {
      // Skip folders without a valid .config.json
    }
  }

  return decks.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createDeck(
  name: string,
  coverColor: string,
  icon: string,
): Promise<Deck> {
  const id = slugify(name);
  const dir = await deckDir(id);

  if (await exists(dir)) {
    throw new Error(`A deck named "${name}" already exists.`);
  }

  await mkdir(dir, { recursive: true });
  const config: DeckConfig = { name, coverColor, icon };
  await writeTextFile(await deckConfigPath(id), JSON.stringify(config, null, 2));

  return { id, ...config };
}

export async function updateDeckConfig(
  id: string,
  config: DeckConfig,
): Promise<void> {
  await writeTextFile(await deckConfigPath(id), JSON.stringify(config, null, 2));
}

export async function renameDeck(
  oldId: string,
  newName: string,
  coverColor: string,
  icon: string,
): Promise<Deck> {
  const newId = slugify(newName);

  if (newId !== oldId) {
    const newDir = await deckDir(newId);
    if (await exists(newDir)) {
      throw new Error(`A deck named "${newName}" already exists.`);
    }
    const oldDir = await deckDir(oldId);
    await rename(oldDir, newDir);
  }

  const config: DeckConfig = { name: newName, coverColor, icon };
  await writeTextFile(await deckConfigPath(newId), JSON.stringify(config, null, 2));

  return { id: newId, ...config };
}

export async function deleteDeck(id: string): Promise<void> {
  const dir = await deckDir(id);
  await remove(dir, { recursive: true });
}
