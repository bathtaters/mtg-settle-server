import { Card, Game } from "../models/_types"
import { downloadImage, renameImage, deleteImage } from '../libs/storage'
import { getSetList, getSetCards, getSetImage, getCardImage }  from '../libs/fetch'
import { getImageURI } from '../config/fetch.cfg'

export const storeCardImage = (cardData: Partial<Card>, filename: string): Promise<void> => downloadImage(getImageURI(cardData), filename)

export async function updateCardImage(update: Partial<Card>, current?: Card) {
  if (!current) {
    if (!update.scryfallId) delete update.img
    if (!update.img) return
    return storeCardImage(update, update.img)
  }

  if (!('img' in update) || update.img === current.img) return
  if (update.img  &&  current.img) return renameImage(current.img, update.img)
  if (!update.img &&  current.img) return deleteImage(current.img)
  if (!current.img  && update.img) return storeCardImage(current, update.img)
}

export async function updateGameSet(update: Partial<Game>, current?: Game) {
  if (!update.art && update.setCode && (!current || update.setCode !== current.setCode))
    update.art = await getSetImage(update.setCode)
}

// Add adapters here
export { getSetList, getSetCards, getSetImage, getCardImage } 
export { downloadImage, renameImage, deleteImage }