import { Card, CardSet, Game } from "../models/_types"
import { fetchData, queryDB }  from '../libs/fetch'
import { storeImage, deleteImage, pathToUrl } from '../libs/storage'
import { normalizeCard, normalizeSet } from "../utils/fetch.utils"
import { cardQuery, setQuery, setInfoURI, setSymbolKey, cardImageURI } from "../config/fetch.cfg"
import Model from "../../engine/models/Model"

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
  if (update.img   && current.img) throw new Error('Card image FileID cannot be modified, can only be generated or deleted.')
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
  if (!source) throw new Error('Cannot determine image source to store: '+JSON.stringify(card))
  const img = await storeImage(source)
  card.img = img.img
  card.url = img.url
  return card
}

export async function deleteCardImage(card: Card|Partial<Card>, Model?: Model<Card>): Promise<Card|Partial<Card>> {
  if (Model && !card.id) throw new Error('Must include CardID in order to delete image: '+JSON.stringify(card))
  if (!card.img) throw new Error('Cannot determine image ID to delete: '+JSON.stringify(card))
  await deleteImage(card.img)
  if (Model) await Model.update(card.id, { img: undefined, url: undefined }, 'id')
  delete card.img
  delete card.url
  return card
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

export { pathToUrl }