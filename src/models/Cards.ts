import { randomUUID } from 'crypto'
import Model from '../../engine/models/Model'
import { Feedback } from '../../engine/models/Model.d'
import { Card } from './_types'
import { getSetCards, storeCardImage, updateCardImage, deleteImage } from '../services/fetch.services'
import { cardID, setCode } from './schema.shared'
import { sqlArray } from '../utils/common.utils'
import * as errors from '../config/errors'

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
    await this.clearImages([id], idKey)
    return super.remove(id, idKey)
  }

  async batchRemove(idList: Card[keyof Card][], idKey?: keyof Card, invert: boolean = false): Promise<Feedback> {
    await this.clearImages(idList, idKey, invert)
    return super.custom<void>(`DELETE FROM ${this.title} WHERE ${idKey || this.primaryId} ${invert ? 'NOT ' : ''}IN ${sqlArray(idList)}`, idList)
      .then(() => ({ success: true }))
  }


  async getSetList(): Promise<Card['setCode'][]> {
    return super.custom<{ setCode: Card['setCode'] }>(`SELECT setCode FROM ${this.title} GROUP BY setCode`)
      .then((cards) => cards.map(({ setCode }) => setCode))
  }

  getRandomIds(count: number, setCode: Card["setCode"]): Promise<Card["id"][]> {
    return super.custom<{ id: Card["id"] }>(`SELECT id FROM ${this.title} WHERE setCode = ? ORDER BY random() LIMIT ?`, [setCode, count])
      .then((cards) => cards.map(({ id }) => id as string))
  }

  async addSet(setCode: Card['setCode'], overwrite: boolean = false): Promise<Feedback> {
    const setCards = await getSetCards(setCode)
    return super.batchAdd(setCards, overwrite ? 'overwrite' : 'skip')
  }

  async getImage(id: Card[keyof Card], idKey?: keyof Card): Promise<Card['img']>  {
    const existing = await super.get(id, idKey)
    if (!existing) throw errors.noEntry(id)
    if (existing.img) return existing.img

    const img = randomUUID()
    await storeCardImage({ ...existing, img })
    await super.update(existing.id, { img })
    return img
  }

  async clearImages(idList: Card[keyof Card][], idKey?: keyof Card, invert: boolean = false): Promise<Feedback> {
    if (idKey && !Object.keys(this.schema).includes(idKey)) throw errors.badKey(idKey, this.title)
    
    const imgs: Partial<Card>[] = await super.custom<{ img: Required<Card["img"]> }>(
      `SELECT img FROM ${this.title} WHERE ${idKey || this.primaryId} ${invert ? 'NOT ' : ''}IN ${sqlArray(idList)} AND img IS NOT NULL`,
      idList, true
    )
    for (const data of imgs) { if (data.img) await deleteImage(data.img) }
    return { success: true }
  }
}

export default new Cards()