import { Definition } from '../../engine/models/Model.d'
import { normalizeDate } from '../libs/date'

export const date: Definition = Object.freeze({
  typeStr: "string",
  limits: { min: 10, max: 10 },
  setAdapter: normalizeDate,
  html: 'date',
})
  
export const setCode: Definition = Object.freeze({
  typeStr: "string",
  limits: { min: 3, max: 5 },
  setAdapter: (code: string) => (code || '').toUpperCase(),
})

// ie. scryfallID
export const cardID: Definition = Object.freeze({
  typeStr: "uuid",
  limits: { min: 36, max: 36 },
})
