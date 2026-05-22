import { useState, useEffect } from 'react';
import { useDecks } from './useDecks';
import { type Deck } from '../types';

export type AppMode = 'manage' | 'learn'
export type AppView = { screen: 'home' } | { screen: 'deck-detail'; deckId: string }

type UseViewManagerResult = {
  mode: AppMode
  view: AppView
  learnDeckId: string | null
  currentDeck: Deck | undefined
  learnDeck: Deck | undefined
  changeMode: (m: AppMode) => void
  setView: (v: AppView) => void
  setLearnDeckId: (id: string | null) => void
}

export function useViewManager(): UseViewManagerResult {
  const { decks } = useDecks();
  const [mode, setMode] = useState<AppMode>('manage');
  const [view, setView] = useState<AppView>({ screen: 'home' });
  const [learnDeckId, setLearnDeckId] = useState<string | null>(null);

  useEffect(() => {
    if (decks.length === 0) setMode('manage');
  }, [decks.length]);

  const changeMode = (m: AppMode) => {
    setMode(m);
    if (m === 'learn' && !learnDeckId && decks.length > 0) {
      setLearnDeckId(decks[0].id);
    }
  };

  const currentDeck = view.screen === 'deck-detail' ? decks.find(d => d.id === view.deckId) : undefined;
  const learnDeck = learnDeckId
    ? (decks.find(d => d.id === learnDeckId) ?? decks[0])
    : decks[0];

  return { mode, view, learnDeckId, currentDeck, learnDeck, changeMode, setView, setLearnDeckId };
}
