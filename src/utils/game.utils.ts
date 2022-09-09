import { Game, CardSet, GameCardJoined, Card, DateType } from '../models/_types'
import { randomInt } from 'crypto'
import RegEx from '../../engine/libs/regex'
import * as date from '../../engine/libs/date'
import { pathToUrl } from '../libs/storage'

export type UIDate = Date | string | number
const dateRegex = RegEx(/^\d{4}-\d{2}-\d{2}$/)

export const isIsoDate = (dateIn: UIDate) => typeof dateIn === 'string' && dateRegex.test(dateIn)
export const normalizeDate = (dateIn: UIDate) => isIsoDate(dateIn) ? dateIn :
  date.formatDateISO(!date.isDate(dateIn) ? new Date(dateIn) : dateIn) as DateType

export const getRandomEntry = <Type>(valueList: Type[]): Type => valueList[randomInt(0, valueList.length)]

export const getRandomEntries = <Type>(valueList: Type[], count: number): Type[] => {
  if (valueList.length >= count) throw new Error(`List is too small (${valueList.length}) to find ${count} random entries.`)
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