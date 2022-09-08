import { Card as GQLCard, Set as GQLSet } from "mtggraphql"
import { Card, CardSet } from "../models/_types"
import { Normalizer } from "../libs/fetch"
import { testObject } from "./common.utils"
import { ignoreCards, ignoreSets } from "../config/fetch.cfg"
import logger from "../../engine/libs/log"


const validSet = (set: any): set is GQLSet => set &&
  typeof set.code        === 'string' &&
  typeof set.name        === 'string' &&
  typeof set.releaseDate === 'string' &&
  (!set.type  || typeof set.type  === 'string') &&
  (!set.block || typeof set.block === 'string')

// @ts-ignore // Using GQLSet guard to help show types overrides ts-common-sense
export const normalizeSet: Normalizer<CardSet> = (set: any) => {
  if (!validSet(set)) {
    logger.info(`Skipped set: ${JSON.stringify(set)}`)
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
  typeof card.artist === 'string' && typeof card.type                   === 'string' &&
  typeof card.number === 'string'

// @ts-ignore // Using GQLCard guard to help show types overrides ts-common-sense
export const normalizeCard: Normalizer<Card> = (card: any) => {
  if (!validCard(card)) {
    logger.info(`Skipped card: ${JSON.stringify(card)}`)
    return null
  }
  if(testObject(card, ...ignoreCards)) return null

  return {
    number: card.number && !isNaN(+card.number) ? +card.number : null,
    id: card.uuid,
    name: card.name,
    artist: card.artist,
    setCode: card.setCode,
    scryfallId: card.identifiers?.scryfallId,
    type: card.type,
  }
}



let prevReq = {} as { [key: string]: number }

export function delayRequest(minSpacingMs: number, key: string): Promise<void> {
  if (!minSpacingMs) return Promise.resolve()

  const diff = new Date().getTime() - (prevReq[key] || 0)
  
  if (diff > minSpacingMs) {
    prevReq[key] = diff + (prevReq[key] || 0)
    return Promise.resolve()
  }
  prevReq[key] = minSpacingMs + (prevReq[key] || 0)
  return new Promise((res) => setTimeout(res, minSpacingMs - diff))
}