import { useState } from 'react';
import { type Deck, type Card } from '../types';

export type ConfirmState = {
  title: string
  message: string
  confirmText: string
  danger: boolean
  onConfirm: () => void
}

type DeckEditorState = Partial<Deck>
type CardEditorState = Partial<Card> & { deckId: string }

type UseModalManagerResult = {
  deckEditor: DeckEditorState | null
  cardEditor: CardEditorState | null
  confirmDlg: ConfirmState | null
  hasOpenModal: boolean
  openCreateDeck: () => void
  openEditDeck: (deck: Deck) => void
  closeDeckEditor: () => void
  openCreateCard: (deckId: string) => void
  openEditCard: (card: Card) => void
  closeCardEditor: () => void
  openConfirm: (state: ConfirmState) => void
  closeConfirm: () => void
}

export function useModalManager(): UseModalManagerResult {
  const [deckEditor, setDeckEditor] = useState<DeckEditorState | null>(null);
  const [cardEditor, setCardEditor] = useState<CardEditorState | null>(null);
  const [confirmDlg, setConfirmDlg] = useState<ConfirmState | null>(null);

  return {
    deckEditor,
    cardEditor,
    confirmDlg,
    hasOpenModal: !!(deckEditor || cardEditor || confirmDlg),
    openCreateDeck: () => setDeckEditor({}),
    openEditDeck: (deck) => setDeckEditor(deck),
    closeDeckEditor: () => setDeckEditor(null),
    openCreateCard: (deckId) => setCardEditor({ deckId }),
    openEditCard: (card) => setCardEditor({ ...card }),
    closeCardEditor: () => setCardEditor(null),
    openConfirm: (state) => setConfirmDlg(state),
    closeConfirm: () => setConfirmDlg(null),
  };
}
