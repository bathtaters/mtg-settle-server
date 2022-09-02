import { Card, CardSet, Game } from "../models/_types"
import { fetchData, queryDB }  from '../libs/fetch'
import { storeImage, renameImage, deleteImage } from '../libs/storage'
import { normalizeCard, normalizeSet } from "../utils/fetch.utils"
import { cardQuery, setQuery, setInfoURI, setSymbolKey, cardImageURI } from "../config/fetch.cfg"

export async function updateCardImage(update: Partial<Card>, current?: Card): Promise<void> {
  if (!current) {
    if (!update.scryfallId) delete update.img
    if (!update.img) return
    return storeCardImage(update)
  }

  if (!('img' in update) || update.img === current.img) return
  if (update.img  &&  current.img) return renameImage(current.img, update.img)
  if (!update.img &&  current.img) return deleteImage(current.img)
  if (!current.img  && update.img) return storeCardImage(current)
}

export async function updateGameSet(update: Partial<Game>, current?: Game): Promise<void> {
  if (!update.art && update.setCode && (!current || update.setCode !== current.setCode))
    update.art = await getSetImage(update.setCode)
}


export const getSetList = () => queryDB({ query: setQuery, variables: { take: 100 } }, 'sets', normalizeSet)

export const getSetCards = (setCode: CardSet['code']) => queryDB({ query: cardQuery, variables: { setCode } }, 'sets.0.cards', normalizeCard)

export async function storeCardImage(card: Partial<Card>): Promise<void> {
  if (!card.img) throw new Error('Cannot create an image with no name: '+card.id)
  return storeImage(cardImageURI(card), card.img)
}

export async function getSetImage(setCode: CardSet['code']): Promise<Game['art']> {
  let setInfo = await fetchData(setInfoURI(setCode), "object")
  if (!setInfo || !(setSymbolKey in setInfo) || typeof setInfo[setSymbolKey] !== 'string') {
    console.warn(`No set symbol found for ${setCode}`)
    console.debug(JSON.stringify(setInfo))
    return
  }
  return fetchData(setInfo[setSymbolKey]) || undefined
}

export { storeImage, renameImage, deleteImage }