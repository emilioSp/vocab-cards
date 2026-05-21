import { appDataDir, join } from '@tauri-apps/api/path';

async function base(): Promise<string> {
  const appData = await appDataDir();
  console.log('[paths] appDataDir =', appData);
  return join(appData, 'decks');
}

export async function decksRoot(): Promise<string> {
  return base();
}

export async function deckDir(deckId: string): Promise<string> {
  return join(await base(), deckId);
}

export async function deckConfigPath(deckId: string): Promise<string> {
  return join(await base(), deckId, '.config.json');
}

export async function cardFilePath(deckId: string, cardId: string): Promise<string> {
  return join(await base(), deckId, `${cardId}.json`);
}
