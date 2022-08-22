const Model = require('../internal/models/Model')
const { setCode } = require('./schema.shared')

class Sets extends Model {
  constructor() {
    super('sets', {
      code: { isPrimary: true, ...setCode },
      name: {
        typeStr: "string*",
        limits: { min: 0, max: 100 },
      },
      block: {
        typeStr: "string*",
        limits: { min: 0, max: 100 },
      },
      releaseDate: { typeStr: "date" },
      skip: { typeStr: "boolean" },
    })
  }

  updateAll() {
    throw new Error('updateAll not implemented')
  }
}

module.exports = new Sets()