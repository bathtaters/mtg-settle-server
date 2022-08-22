const Model = require('../internal/models/Model')
const { cardID, date } = require('./schema.shared')
const { cardsPerGame } = require('../config/game.cfg')

class GameCards extends Model {
  constructor() {
    super('gamecards', {
      date: { ...date },
      position: { typeStr: 'int', limits: { min: 0, max: cardsPerGame - 1 } },
      cardId: { ...cardID },
    })
  }

  getPage(page, size) { return super.getPage(page, size, true, 'date') } // Default sorting
}

module.exports = new GameCards()