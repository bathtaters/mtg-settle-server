export type DateType = string
export type SetCodeType = string
export type CardIDType = string

export interface Card {
  id:         CardIDType,
  scryfallId: CardIDType,
  setCode:    SetCodeType,
  name:       string,
  artist:     string,
  type:       string,
  img?:       string,
}

export interface CardSet {
  code:        SetCodeType,
  name:        string,
  type:        string,
  block:       string,
  skip:        boolean,
  releaseDate: DateType
}

export interface GameCard {
  id: number,
  date: DateType,
  position: number,
  cardId: CardIDType,
}

export interface Game {
  date: DateType,
  setCode: SetCodeType,
  art?: string,
}