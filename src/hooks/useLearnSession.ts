import { useState, useEffect, useCallback, useRef } from 'react';
import { type Card, type CardData } from '../types';
import { updateCard } from '../storage/cardStorage';

type Reviewed = { good: number; bad: number; skipped: number }

type UseLearnSessionResult = {
  currentCard: Card | null
  idx: number
  total: number
  flipped: boolean
  streak: number
  reviewed: Reviewed
  done: boolean
  flip: () => void
  score: (delta: number) => void
  skip: () => void
  goBack: () => void
  restart: () => void
}

function weightedShuffle(cards: Card[]): Card[] {
  return [...cards]
    .map(c => ({ card: c, key: Math.random() - (c.score * 0.05) }))
    .sort((a, b) => a.key - b.key)
    .map(x => x.card);
}

export function useLearnSession(cards: Card[]): UseLearnSessionResult {
  const [order, setOrder] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [streak, setStreak] = useState(0);
  const [reviewed, setReviewed] = useState<Reviewed>({ good: 0, bad: 0, skipped: 0 });
  const [done, setDone] = useState(false);

  const orderRef = useRef(order);
  orderRef.current = order;

  const shuffle = useCallback((source: Card[]) => {
    const shuffled = weightedShuffle(source);
    setOrder(shuffled);
    setIdx(0);
    setFlipped(false);
    setStreak(0);
    setReviewed({ good: 0, bad: 0, skipped: 0 });
    setDone(false);
  }, []);

  useEffect(() => {
    if (cards.length > 0) shuffle(cards);
    else { setOrder([]); setDone(false); }
  }, [cards.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = useCallback((currentIdx: number, currentOrder: Card[]) => {
    setFlipped(false);
    if (currentIdx + 1 >= currentOrder.length) {
      setDone(true);
    } else {
      setIdx(currentIdx + 1);
    }
  }, []);

  const flip = useCallback(() => setFlipped(f => !f), []);

  const score = useCallback((delta: number) => {
    const current = orderRef.current[idx];
    if (!current) return;

    const newScore = (current.score ?? 0) + delta;
    updateCard(current.deckId, current.id, { score: newScore } as Partial<CardData>).catch((e) => {
      console.error(e);
    });

    // Update the card in order so restart re-uses updated scores
    setOrder(prev => prev.map((c, i) => i === idx ? { ...c, score: newScore } : c));

    if (delta > 0) {
      setReviewed(r => ({ ...r, good: r.good + 1 }));
      setStreak(s => s + 1);
    } else {
      setReviewed(r => ({ ...r, bad: r.bad + 1 }));
      setStreak(0);
    }

    setTimeout(() => advance(idx, orderRef.current), 380);
  }, [idx, advance]);

  const skip = useCallback(() => {
    setReviewed(r => ({ ...r, skipped: r.skipped + 1 }));
    advance(idx, orderRef.current);
  }, [idx, advance]);

  const goBack = useCallback(() => {
    if (idx > 0) {
      setIdx(i => i - 1);
      setFlipped(false);
    }
  }, [idx]);

  const restart = useCallback(() => {
    shuffle(orderRef.current);
  }, [shuffle]);

  // Keyboard handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (done) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        flip();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        score(1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        score(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skip();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flip, score, skip, goBack, done]);

  return {
    currentCard: order[idx] ?? null,
    idx,
    total: order.length,
    flipped,
    streak,
    reviewed,
    done,
    flip,
    score,
    skip,
    goBack,
    restart,
  };
}
