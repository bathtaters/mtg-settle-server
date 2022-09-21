import { ArrayDefinition } from '../../engine/models/Model.d'

export type DateType = string
export type SetCodeType = string
export type CardIDType = string

export interface Card {
  number:     number,
  id:         CardIDType,
  scryfallId: CardIDType,
  setCode:    SetCodeType,
  name:       string,
  artist:     string,
  type:       string,
  img?:       string,
  url?:       string,
}

export interface CardSet {
  code:        SetCodeType,
  name:        string,
  type:        string,
  block?:      string,
  skip:        boolean,
  releaseDate: DateType
}

export interface Game {
  date: DateType,
  setCode: SetCodeType,
  art?: string,
  cards?: string[],
}

export interface Cache<DataType = any> {
  id: string,
  data: DataType,
  timestamp: number
}

export interface GameCardJoined extends Card { idx: ArrayDefinition["idx"] }