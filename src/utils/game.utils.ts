import { DateType } from "../models/_types"
import RegEx from '../../engine/libs/regex'
import * as date from '../../engine/libs/date'

export type UIDate = Date | string | number
// const { isDate, formatDateISO } = date
const dateRegex = RegEx(/^\d{4}-\d{2}-\d{2}$/)

const isIsoDate = (dateIn: UIDate) => typeof dateIn === 'string' && dateRegex.test(dateIn)
export const normalizeDate = (dateIn: UIDate) => isIsoDate(dateIn) ? dateIn :
  date.formatDateISO(!date.isDate(dateIn) ? new Date(dateIn) : dateIn) as DateType