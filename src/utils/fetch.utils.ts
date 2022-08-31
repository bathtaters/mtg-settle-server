import { Card as GQLCard, Set as GQLSet } from "mtggraphql"
import { Card, CardSet } from "../models/_types"
import { Normalizer } from "../libs/fetch"
import { testObject } from "./common.utils"
import { ignoreCards, ignoreSets } from "../config/fetch.cfg"


const validSet = (set: any): set is GQLSet => set &&
  typeof set.code        === 'string' &&
  typeof set.name        === 'string' &&
  typeof set.releaseDate === 'string' &&
  (!set.type  || typeof set.type  === 'string') &&
  (!set.block || typeof set.block === 'string')

// @ts-ignore // Using GQLSet guard to help show types overrides ts-common-sense
export const normalizeSet: Normalizer<CardSet> = (set: any) => {
  if (!validSet(set)) {
    console.warn(`Skipped set: ${JSON.stringify(set)}`)
    return null
  }
  return {
    code:  set.code,
    name:  set.name,
    type:  set.type,
    block: set.block || undefined,
    skip:  testObject(set, ...ignoreSets),
    releaseDate: set.releaseDate,
  }
}


const validCard = (card: any): card is Required<GQLCard> => card && card.identifiers &&
  typeof card.uuid   === 'string' && typeof card.identifiers.scryfallId === 'string' && 
  typeof card.name   === 'string' && typeof card.setCode                === 'string' &&
  typeof card.artist === 'string' && typeof card.type                   === 'string'

// @ts-ignore // Using GQLCard guard to help show types overrides ts-common-sense
export const normalizeCard: Normalizer<Card> = (card: any) => {
  if (!validCard(card)) {
    console.warn(`Skipped card: ${JSON.stringify(card)}`)
    return null
  }
  if(testObject(card, ...ignoreCards)) return null

  return {
    id: card.uuid,
    name: card.name,
    artist: card.artist,
    setCode: card.setCode,
    scryfallId: card.identifiers?.scryfallId,
    type: card.type,
  }
}