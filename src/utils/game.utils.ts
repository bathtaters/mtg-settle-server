import { randomInt } from 'crypto'
import { DateType } from "../models/_types"
import RegEx from '../../engine/libs/regex'
import * as date from '../../engine/libs/date'

export type UIDate = Date | string | number
// const { isDate, formatDateISO } = date
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