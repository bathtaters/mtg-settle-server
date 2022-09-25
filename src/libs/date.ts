import { startOfTomorrow, eachDayOfInterval, addDays } from 'date-fns'
import { formatDateISO, isDate, parseISO } from '../../engine/libs/date'
import { DateType } from '../models/_types'
import RegEx from '../../engine/libs/regex'

export type UIDate = Date | string | number
const dateRegex = RegEx(/^\d{4}-\d{2}-\d{2}$/)

export const isIsoDate = (dateIn: UIDate) => typeof dateIn === 'string' && dateRegex.test(dateIn)

export const normalizeDate = (dateIn: UIDate) => isIsoDate(dateIn) ? dateIn :
  formatDateISO(!isDate(dateIn) ? new Date(dateIn) : dateIn) as DateType

export const today = () => formatDateISO(new Date())
export const tomorrow = () => startOfTomorrow().getTime()

const toDate = (date: UIDate): Date => isDate(date) ? date as Date : new Date(date+'T00:00:00')
export const daysInRange = (start: UIDate, end: UIDate) => eachDayOfInterval({ start: toDate(start), end: toDate(end) }).map(formatDateISO)

export const addDay = (date: UIDate, add: number = 1) =>  formatDateISO(addDays(toDate(date), add))

export { formatDateISO, isDate, parseISO }