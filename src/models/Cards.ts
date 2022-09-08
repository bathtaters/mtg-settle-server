import logger from '../../engine/libs/log'
import Model from '../../engine/models/Model'
import { Feedback, IfExistsBehavior } from '../../engine/models/Model.d'
import { Card } from './_types'
import { getSetCards, updateCardImage, deleteCardImage } from '../services/fetch.services'
import { cardID, setCode } from './schema.shared'
import { sqlArray } from '../utils/common.utils'
import { multiUpdate } from '../config/sql.constants'
import * as errors from '../config/errors'

class Cards extends Model<Card> {
  constructor() {
    super('cards', {
      number:  { typeStr: "int?", limits: { min: 0, max: 10000 } },
      id: { isPrimary: true, ...cardID },
      scryfallId: { ...cardID },
      setCode: { ...setCode },
      name:    { typeStr: "string*", limits: { min: 0, max: 100 } },
      artist:  { typeStr: "string*", limits: { min: 0, max: 100 } },
      type:    { typeStr: "string*", limits: { min: 0, max: 500 } },
      img:     { typeStr: "string?", limits: { min: 0, max:  50 } },
      url:     { typeStr: "string?", limits: { min: 0, max:  50 }, html: 'readonly' },
    })
  }

  async add(data: Card, ifExists: IfExistsBehavior): Promise<Card> {
    await updateCardImage(data)
    return super.add(data, ifExists)
  }

  update(id: Card[keyof Card], data: Partial<Card>, idKey?: keyof Card): Promise<Feedback> {
    return super.update(id, data, idKey, updateCardImage)
  }

  async remove(id: Card[keyof Card], idKey?: keyof Card): Promise<Feedback> {
    await this.clearImages([id], idKey, false, true)
    return super.remove(id, idKey)
  }

  async batchRemove(idList: Card[keyof Card][], idKey?: keyof Card, invert: boolean = false): Promise<Feedback> {
    await this.clearImages(idList, idKey, invert, true)
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

  async listImageIds(): Promise<string[]> {
    return super.custom<{ img: string }>(`SELECT img FROM ${this.title} WHERE img IS NOT NULL`)
      .then((cards) => cards.map(({ img }) => img))
  }

  async getImages(idList: Card[keyof Card][], idKey?: keyof Card, invert: boolean = false, overwrite: boolean = false): Promise<void>  {
    if (idKey && !Object.keys(this.schema).includes(idKey)) throw errors.badKey(idKey, this.title)

    let cards = await super.custom<Card>(
      `SELECT * FROM ${this.title} WHERE ${idKey || this.primaryId} ${invert ? 'NOT ' : ''}IN ${sqlArray(idList)}`,
      idList, true
    )
    if (!cards.length) throw errors.noEntry(idList.join(','))
    
    if (!overwrite) cards = cards.filter(({ img }) => !img)
    for (let card of cards) {
      card.img = 'add'
      await updateCardImage(card)
    }

    const sqlData = multiUpdate(this.title, this.primaryId, cards, ['img','url'])
    if (!sqlData) {
      logger.verbose(`No new images needed to be uploaded for ${idKey || this.primaryId}: ${idList.join(',')}`)
      return
    }

    await super.custom(sqlData[0], sqlData[1], true)
  }

  async clearImages(idList: Card[keyof Card][], idKey?: keyof Card, invert: boolean = false, skipDbUpdate: boolean = false): Promise<Feedback> {
    if (idKey && !Object.keys(this.schema).includes(idKey)) throw errors.badKey(idKey, this.title)
    
    const cards: Partial<Card>[] = await super.custom<{ id: Card["id"], img: Required<Card["img"]> }>(
      `SELECT id, img FROM ${this.title} WHERE ${idKey || this.primaryId} ${invert ? 'NOT ' : ''}IN ${sqlArray(idList)} AND img IS NOT NULL`,
      idList, true
    )
    for (const card of cards) {
      if (card.img) await deleteCardImage(card, skipDbUpdate ? undefined : this)
    }
    return { success: true }
  }
}

export default new Cards()

export interface ImageURLs { [id: Card["id"]]: string }