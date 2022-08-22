const { normalizeDate } = require('../utils/game.utils')

module.exports = {
  date: {
    typeStr: "string",
    limits: { min: 10, max: 10 },
    setAdapter: normalizeDate,
  },
  
  setCode: {
    typeStr: "string",
    limits: { min: 3, max: 5 },
    setAdapter: (code) => (code || '').toUpperCase(),
  },

  cardID: { // ie. scryfallID
    typeStr: "uuid",
    limits: { min: 36, max: 36 },
  },
}

Object.keys(module.exports).forEach((key) => { module.exports[key] = Object.freeze(module.exports[key]) })