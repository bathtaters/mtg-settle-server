const Model = require('../internal/models/Model')
const { updateGameSet } = require('../services/fetch.services')
const { setCode, date } = require('./schema.shared')

class Games extends Model {
  constructor() {
    super('games', {
      date: { isPrimary: true, ...date },
      setCode: { ...setCode },
      art: { typeStr: "string*?", limits: { min: 0, max: 2048 } },
    })
  }

  async add(data) {
    await updateGameSet(data)
    return super.add(data)
  }

  update(id, data, idKey = null) {
    return super.update(id, data, idKey, updateGameSet)
  }
}

module.exports = new Games()