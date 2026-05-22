import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { type Card, type CardData } from '../types';
import {
  listCards,
  createCard,
  updateCard,
  deleteCard,
} from '../storage/cardStorage';

type CardsContextValue = {
  cards: Card[]
  loading: boolean
  error: string | null
  clearError: () => void
  setActiveDeck: (deckId: string) => void
  createCard: (data: Omit<CardData, 'score'>) => Promise<Card | null>
  updateCard: (cardId: string, data: Partial<CardData>) => Promise<Card | null>
  deleteCard: (cardId: string) => Promise<void>
}

const CardsContext = createContext<CardsContextValue | null>(null);

export function CardsProvider({ children }: { children: React.ReactNode }) {
  const [activeDeckId, setActiveDeck] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeDeckId) return;
    let cancelled = false;
    setLoading(true);
    setCards([]);
    (async () => {
      try {
        const result = await listCards(activeDeckId);
        if (!cancelled) setCards(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load cards.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeDeckId]);

  const handleCreateCard = useCallback(async (
    data: Omit<CardData, 'score'>,
  ): Promise<Card | null> => {
    try {
      const card = await createCard(activeDeckId, data);
      setCards(prev => [...prev, card].sort((a, b) => a.word.localeCompare(b.word)));
      return card;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create card.');
      return null;
    }
  }, [activeDeckId]);

  const handleUpdateCard = useCallback(async (
    cardId: string, data: Partial<CardData>,
  ): Promise<Card | null> => {
    try {
      const updated = await updateCard(activeDeckId, cardId, data);
      setCards(prev =>
        prev.map(c => c.id === cardId ? updated : c)
            .sort((a, b) => a.word.localeCompare(b.word)),
      );
      return updated;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update card.');
      return null;
    }
  }, [activeDeckId]);

  const handleDeleteCard = useCallback(async (cardId: string): Promise<void> => {
    try {
      await deleteCard(activeDeckId, cardId);
      setCards(prev => prev.filter(c => c.id !== cardId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete card.');
    }
  }, [activeDeckId]);

  return (
    <CardsContext.Provider value={{
      cards,
      loading,
      error,
      clearError: () => setError(null),
      setActiveDeck,
      createCard: handleCreateCard,
      updateCard: handleUpdateCard,
      deleteCard: handleDeleteCard,
    }}>
      {children}
    </CardsContext.Provider>
  );
}

export function useCards(deckId: string) {
  const ctx = useContext(CardsContext);
  if (!ctx) throw new Error('useCards used outside CardsProvider');
  useEffect(() => { if (deckId) ctx.setActiveDeck(deckId); }, [deckId]);
  return {
    cards: ctx.cards,
    loading: ctx.loading,
    error: ctx.error,
    clearError: ctx.clearError,
    createCard: ctx.createCard,
    updateCard: ctx.updateCard,
    deleteCard: ctx.deleteCard,
  };
}
