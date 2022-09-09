import { startOfTomorrow } from 'date-fns'
import { formatDateISO, isDate, parseISO } from '../../engine/libs/date'
import { DateType } from '../models/_types'
import RegEx from '../../engine/libs/regex'

export type UIDate = Date | string | number
const dateRegex = RegEx(/^\d{4}-\d{2}-\d{2}$/)

export const isIsoDate = (dateIn: UIDate) => typeof dateIn === 'string' && dateRegex.test(dateIn)

export const normalizeDate = (dateIn: UIDate) => isIsoDate(dateIn) ? dateIn :
  formatDateISO(!isDate(dateIn) ? new Date(dateIn) : dateIn) as DateType

export const today = () => formatDateISO(new Date())
export const tomorrow = startOfTomorrow
export const untilTomorrow = () => startOfTomorrow().getTime() - new Date().getTime()

export { formatDateISO, isDate, parseISO }