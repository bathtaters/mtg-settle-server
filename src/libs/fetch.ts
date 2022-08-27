import { Card, CardSet, Game } from "../models/_types"

export async function getSetList(): Promise<CardSet[]>{
 throw new Error('getSetList not connected')
}

export async function getSetCards(setCode: CardSet['code']): Promise<Card[]> {
 throw new Error('getSetCards not connected')
}

export async function getSetImage(setCode: CardSet['code']): Promise<Game['art']> {
 throw new Error('getSetImage not connected')
}

export async function getCardImage(card: Card): Promise<Card['img']> {
 throw new Error('getCardImage not connected')
}
