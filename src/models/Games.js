const Model = require('../internal/models/Model')
const { setCode, date } = require('./schema.shared')

class Games extends Model {
  constructor() {
    super('games', {
      date: { isPrimary: true, ...date },
      setCode: { ...setCode },
      art: {
        typeStr: "string*?",
        limits: { min: 0, max: 2048 },
      },
    })
  }

  async add(data) {
    await this.#updateCallback(data)
    return super.add(data)
  }

  update(id, data, idKey = null, updateCb = this.#updateCallback) {
    return super.update(id, data, idKey, updateCb)
  }

  async getArt(code) {
    throw new Error('getArt not implemented')
  }

  async #updateCallback(data, old = null) {
    if (!data.art && data.code && (!old || data.code !== old.code))
      data.art = await this.getArt(data.code)
  }
}

module.exports = new Games()