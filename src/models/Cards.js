const { randomUUID } = require('crypto')
const Model = require('../internal/models/Model')
const { getSetCards, storeCardImage, updateCardImage, deleteImage } = require('../services/fetch.services')
const { cardID, setCode } = require('./schema.shared')
const errors = require('../config/errors')

class Cards extends Model {
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

  async add(data) {
    await updateCardImage(data)
    return super.add(data)
  }

  update(id, data, idKey = null) {
    return super.update(id, data, idKey, updateCardImage)
  }

  async remove(id, idKey = null) {
    if (idKey && !Object.keys(this.schema).includes(idKey)) throw errors.badKey(idKey, this.title)
    
    const imgs = await super.custom(`SELECT img FROM ${this.title} WHERE ${idKey || this.primaryId} = ? AND img IS NOT NULL`, [id], true)
    for (const data of imgs) { await deleteImage(data.img) }

    return super.remove(id, idKey)
  }

  async addSet(setCode) {
    const setCards = await getSetCards(setCode)
    return super.batchAdd(setCards, 'skip')
  }

  async getImage(id, idKey = null) {
    const existing = await super.get(id, idKey)
    if (!existing) return errors.noEntry(id)
    if (existing.img) return existing.img

    const img = randomUUID()
    await storeCardImage(existing.scryfallId, img)
    await super.update(existing.id, { img })
    return img
  }
}

module.exports = new Cards()