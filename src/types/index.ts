export type Deck = {
  id: string
  name: string
  coverColor: string
  icon: string
  cardCount: number
}

export type Card = {
  id: string
  deckId: string
  word: string
  translation: string
  sampleSentence?: string
  imgBase64?: string
  score: number
}

// Shape written to .config.json on disk (id/deckId derived from path)
export type DeckConfig = {
  name: string
  coverColor: string
  icon: string
}

// Shape written to {word}.json on disk (id/deckId derived from path)
export type CardData = {
  word: string
  translation: string
  sampleSentence?: string
  imgBase64?: string
  score: number
}
