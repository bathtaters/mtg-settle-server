const Model = require('../internal/models/Model')
const { cardID, date } = require('./schema.shared')

class GameCards extends Model {
  constructor() {
    super('gamecards', {
      date: { ...date },
      idx: { 
        typeStr: 'int',
        limits: { min: 0, max: 5 },
      },
      cardId: { ...cardID },
    })
  }

  getPage(page, size) {
    return super.getPage(page, size, true, 'date')
  }
}

module.exports = new GameCards()