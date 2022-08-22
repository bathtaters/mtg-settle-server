const Model = require('../internal/models/Model')
const { getSetList } = require('../services/fetch.services')
const { setCode } = require('./schema.shared')

class Sets extends Model {
  constructor() {
    super('sets', {
      code:  { isPrimary: true, ...setCode },
      name:  { typeStr: "string*", limits: { min: 0, max: 100 } },
      type:  { typeStr: "string",  limits: { min: 0, max:  50 } },
      block: { typeStr: "string*", limits: { min: 0, max: 100 } },
      skip:  { typeStr: "boolean", default: false },
      releaseDate: { typeStr: "date" },
    })
  }

  async updateAll() {
    const setList = await getSetList()
    let added = 0
    // IMPLEMENT BATCH-ADD IN SCAFFOLDING
    for (const set of setList) {
      await super.add(set, true).then((isAdded) => isAdded && added++)
    }
    return [added,setList.count]
  }
}

module.exports = new Sets()