import { useState, useEffect, useCallback } from 'react';
import { type Deck } from '../types';
import {
  listDecks,
  createDeck,
  updateDeckConfig,
  deleteDeck,
  ensureDecksRoot,
} from '../storage/deckStorage';

type UseDecksResult = {
  decks: Deck[]
  loading: boolean
  error: string | null
  clearError: () => void
  createDeck: (name: string, coverColor: string, icon: string) => Promise<Deck | null>
  updateDeck: (deck: Deck, newName: string, coverColor: string, icon: string) => Promise<Deck | null>
  deleteDeck: (id: string) => Promise<void>
  adjustCardCount: (deckId: string, delta: number) => void
}

export function useDecks(): UseDecksResult {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      await ensureDecksRoot();
      setDecks(await listDecks());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load decks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateDeck = useCallback(async (
    name: string,
    coverColor: string,
    icon: string,
  ): Promise<Deck | null> => {
    try {
      const deck = await createDeck(name, coverColor, icon);
      setDecks(prev => [...prev, deck].sort((a, b) => a.name.localeCompare(b.name)));
      return deck;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create deck.');
      return null;
    }
  }, []);

  const handleUpdateDeck = useCallback(async (
    deck: Deck,
    newName: string,
    coverColor: string,
    icon: string,
  ): Promise<Deck | null> => {
    try {
      const config = { name: newName, coverColor, icon };
      await updateDeckConfig(deck.id, config);
      const updated = { ...deck, ...config };
      setDecks(prev =>
        prev.map(d => d.id === deck.id ? updated : d)
            .sort((a, b) => a.name.localeCompare(b.name)),
      );
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update deck.');
      return null;
    }
  }, []);

  const handleDeleteDeck = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteDeck(id);
      setDecks(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete deck.');
    }
  }, []);

  const adjustCardCount = useCallback((deckId: string, delta: number) => {
    setDecks(prev => prev.map(d =>
      d.id === deckId ? { ...d, cardCount: d.cardCount + delta } : d
    ));
  }, []);

  return {
    decks,
    loading,
    error,
    clearError: () => setError(null),
    createDeck: handleCreateDeck,
    updateDeck: handleUpdateDeck,
    deleteDeck: handleDeleteDeck,
    adjustCardCount,
  };
}
