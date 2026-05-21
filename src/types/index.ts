export type Deck = {
  id: string         // slugified folder name
  name: string
  coverColor: string // hex
  icon: string       // emoji char
}

export type Card = {
  id: string              // slugified word (filename without .json)
  deckId: string          // parent deck id
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
