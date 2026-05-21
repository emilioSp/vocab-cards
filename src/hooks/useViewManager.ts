import { useState, useEffect } from 'react';
import { type Deck } from '../types';

export type AppMode = 'manage' | 'learn'
export type AppView = { screen: 'home' } | { screen: 'deck-detail'; deckId: string }

type UseViewManagerResult = {
  mode: AppMode
  view: AppView
  learnDeckId: string | null
  managedDeckId: string
  currentDeck: Deck | undefined
  learnDeck: Deck | undefined
  setMode: (m: AppMode) => void
  setView: (v: AppView) => void
  setLearnDeckId: (id: string | null) => void
}

export function useViewManager(decks: Deck[]): UseViewManagerResult {
  const [mode, setMode] = useState<AppMode>('manage');
  const [view, setView] = useState<AppView>({ screen: 'home' });
  const [learnDeckId, setLearnDeckId] = useState<string | null>(null);

  useEffect(() => {
    if (decks.length === 0) setMode('manage');
  }, [decks.length]);

  useEffect(() => {
    if (mode === 'learn' && !learnDeckId && decks.length > 0) {
      setLearnDeckId(decks[0].id);
    }
  }, [mode, learnDeckId, decks]);

  const managedDeckId = view.screen === 'deck-detail' ? view.deckId : '';
  const currentDeck = view.screen === 'deck-detail' ? decks.find(d => d.id === view.deckId) : undefined;
  const learnDeck = learnDeckId
    ? (decks.find(d => d.id === learnDeckId) ?? decks[0])
    : decks[0];

  return { mode, view, learnDeckId, managedDeckId, currentDeck, learnDeck, setMode, setView, setLearnDeckId };
}
