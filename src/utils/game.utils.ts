import { Game, CardSet, GameCardJoined, Card } from '../models/_types'
import { randomInt } from 'crypto'
import { pathToUrl } from '../libs/storage'
import * as errors from '../config/errors'

export const getRandomEntry = <Type>(valueList: Type[]): Type => valueList[randomInt(0, valueList.length)]

export const getRandomEntries = <Type>(valueList: Type[], count: number): Type[] => {
  if (valueList.length >= count) throw errors.smallList(valueList.length, count)
  let indexes: number[] = []
  while (indexes.length < count) {
    const nextIdx = randomInt(0, valueList.length)
    if (!indexes.includes(nextIdx)) indexes.push(nextIdx)
  }
  return indexes.map((idx) => valueList[idx])
}


const filterCards = ({ id, name, artist, img, url }: GameCardJoined):
  Pick<Card, 'id'|'name'|'artist'|'img'|'url'> =>
  ({ id, name, artist, img: url && pathToUrl(url, true) })

export const combineGame = (
  { date, setCode, art  }: Game,
  { name, block }: CardSet,
  cardDetails: GameCardJoined[]
) => ({
  date, setCode, art, block,
  setName: name,
  cards: cardDetails.sort((a,b) => a.idx - b.idx).map(filterCards)
})