import { useState, useEffect, useCallback } from 'react';
import { type Card, type CardData } from '../types';
import {
  listCards,
  createCard,
  updateCard,
  deleteCard,
} from '../storage/cardStorage';

type UseCardsResult = {
  cards: Card[]
  loading: boolean
  error: string | null
  clearError: () => void
  createCard: (data: Omit<CardData, 'score'>) => Promise<Card | null>
  updateCard: (cardId: string, data: Partial<CardData>) => Promise<Card | null>
  deleteCard: (cardId: string) => Promise<void>
}

export function useCards(deckId: string): UseCardsResult {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deckId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const result = await listCards(deckId);
        if (!cancelled) setCards(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load cards.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [deckId]);

  const handleCreateCard = useCallback(async (
    data: Omit<CardData, 'score'>,
  ): Promise<Card | null> => {
    try {
      const card = await createCard(deckId, data);
      setCards(prev => [...prev, card].sort((a, b) => a.word.localeCompare(b.word)));
      return card;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create card.');
      return null;
    }
  }, [deckId]);

  const handleUpdateCard = useCallback(async (
    cardId: string,
    data: Partial<CardData>,
  ): Promise<Card | null> => {
    try {
      const updated = await updateCard(deckId, cardId, data);
      setCards(prev =>
        prev.map(c => c.id === cardId ? updated : c)
            .sort((a, b) => a.word.localeCompare(b.word)),
      );
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update card.');
      return null;
    }
  }, [deckId]);

  const handleDeleteCard = useCallback(async (cardId: string): Promise<void> => {
    try {
      await deleteCard(deckId, cardId);
      setCards(prev => prev.filter(c => c.id !== cardId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete card.');
    }
  }, [deckId]);

  return {
    cards,
    loading,
    error,
    clearError: () => setError(null),
    createCard: handleCreateCard,
    updateCard: handleUpdateCard,
    deleteCard: handleDeleteCard,
  };
}
