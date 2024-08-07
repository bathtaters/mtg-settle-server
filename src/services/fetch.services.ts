import { Card, CardSet, Game } from "../models/_types"
import logger from "../../engine/libs/log"
import { fetchData, queryDB }  from '../libs/fetch'
import { storeImage, deleteImage, pathToUrl, listIds } from '../libs/storage'
import Model from "../../engine/models/Model"
import { normalizeCard, normalizeSet } from "../utils/fetch.utils"
import { cardQuery, setQuery, setInfoURI, setSymbolKey, cardImageURI, scryfallHeaders } from "../config/fetch.cfg"
import * as errors from '../config/errors'

export async function updateCardImage(update: Partial<Card>, matching?: Card[]): Promise<void> {
  if (!matching || !matching.length) {
    if (!update.scryfallId) {
      delete update.img
      delete update.url
    }
    if (!update.img) return
    await storeCardImage(update)
    return
  }

  const current = matching[0]
  if (!('img' in update) || update.img === current.img) return
  if (update.img   && current.img) throw errors.modifyFileId()
  if (!update.img  && current.img) return deleteImage(current.img).then(() => {
    update.img = undefined
    update.url = undefined
  })
  if (!current.img &&  update.img) return storeCardImage({ ...current, ...update }).then(({ img, url }) => {
    update.img = img
    update.url = url
  })
}

export async function updateGameSet(update: Partial<Game>, matching?: Game[]): Promise<void> {
  if (!update.art && update.setCode && (!matching || !matching[0] || update.setCode !== matching[0].setCode))
    update.art = await getSetImage(update.setCode)
}


export const getSetList = () => queryDB({ query: setQuery, variables: { take: 100 } }, 'sets', normalizeSet)

export const getSetCards = (setCode: CardSet['code']) => queryDB({ query: cardQuery, variables: { setCode } }, 'sets.0.cards', normalizeCard)

export async function storeCardImage(card: Card): Promise<Card>
export async function storeCardImage(card: Partial<Card>): Promise<Partial<Card>>
export async function storeCardImage(card: Card|Partial<Card>): Promise<Card|Partial<Card>> {
  const source = cardImageURI(card)
  if (!source) throw errors.noEntry(JSON.stringify(card))
  const img = await storeImage(source)
  card.img = img.img
  card.url = img.url
  return card
}

export async function deleteCardImage(card: Card|Partial<Card>, Model?: Model<Card>): Promise<Card|Partial<Card>> {
  if (Model && !card.id) throw errors.noID()
  if (!card.img) throw errors.noData('card image')
  await deleteImage(card.img)
  if (Model) await Model.update(card.id, { img: undefined, url: undefined }, 'id')
  delete card.img
  delete card.url
  return card
}

export async function getSetImage(setCode: CardSet['code']): Promise<Game['art']> {
  let setInfo = await fetchData(setInfoURI(setCode), "object", { headers: scryfallHeaders })
  if (!setInfo || !(setSymbolKey in setInfo) || typeof setInfo[setSymbolKey] !== 'string') {
    logger.warn(`No set symbol found for ${setCode}`)
    logger.verbose(JSON.stringify(setInfo))
    return
  }
  return fetchData(setInfo[setSymbolKey]) || undefined
}

export { pathToUrl, listIds, deleteImage }