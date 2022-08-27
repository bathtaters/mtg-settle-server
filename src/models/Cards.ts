import { randomUUID } from 'crypto'
import Model from '../../engine/models/Model'
import { Feedback } from '../../engine/models/Model.d'
import { Card } from './_types'
import { getSetCards, storeCardImage, updateCardImage, deleteImage } from '../services/fetch.services'
import { cardID, setCode } from './schema.shared'
import errors = require('../config/errors')

class Cards extends Model<Card> {
  constructor() {
    super('cards', {
      id: { isPrimary: true, ...cardID },
      scryfallId: { ...cardID },
      setCode: { ...setCode },
      name:    { typeStr: "string*", limits: { min:  0, max: 100 } },
      artist:  { typeStr: "string*", limits: { min:  0, max: 100 } },
      type:    { typeStr: "string*", limits: { min:  0, max: 500 } },
      img:     { typeStr: "uuid?",   limits: { min: 36, max:  36 } },
    })
  }
  
  async add(data: Card): Promise<Card> {
    await updateCardImage(data)
    return super.add(data)
  }

  update(id: Card[keyof Card], data: Partial<Card>, idKey?: keyof Card): Promise<Feedback> {
    return super.update(id, data, idKey, updateCardImage)
  }

  async remove(id: Card[keyof Card], idKey?: keyof Card): Promise<Feedback> {
    if (idKey && !Object.keys(this.schema).includes(idKey)) throw errors.badKey(idKey, this.title)
    
    const imgs = await super.custom(`SELECT img FROM ${this.title} WHERE ${idKey || this.primaryId} = ? AND img IS NOT NULL`, [id], true)
    for (const data of imgs) { if (data.img) await deleteImage(data.img) }

    return super.remove(id, idKey)
  }

  async addSet(setCode: Card['setCode']): Promise<Feedback> {
    const setCards = await getSetCards(setCode)
    return super.batchAdd(setCards, 'skip')
  }

  async getImage(id: Card[keyof Card], idKey?: keyof Card): Promise<Card['img']>  {
    const existing = await super.get(id, idKey)
    if (!existing) throw errors.noEntry(id)
    if (existing.img) return existing.img

    const img = randomUUID()
    await storeCardImage(existing, img)
    await super.update(existing.id, { img })
    return img
  }
}

export default new Cards()