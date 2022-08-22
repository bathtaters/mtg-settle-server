const Model = require('../internal/models/Model')
const { cardID, setCode } = require('./schema.shared')

class Cards extends Model {
  constructor() {
    super('cards', {
      id: { isPrimary: true, ...cardID },
      setCode: { ...setCode },
      name: {
        typeStr: "string*",
        limits: { min: 0, max: 100 },
      },
      artist: {
        typeStr: "string*",
        limits: { min: 0, max: 100 },
      },
      type: {
        typeStr: "string*",
        limits: { min: 0, max: 500 },
      },
      url: {
        typeStr: "uuid?",
        limits: { min: 36, max: 36 },
      },
    })
  }

  storeSet(setCode) {
    throw new Error('storeSet not implemented')
  }

  clearSet(setCode) {
    throw new Error('clearSet not implemented')
  }

  storeImage(scryfallId) {
    throw new Error('storeImage not implemented')
  }

  clearImage(scryfallId) {
    throw new Error('clearImage not implemented')
  }
}

module.exports = new Cards()