import Model from '../../engine/models/Model'
import { GameCard, Card, GameCardJoined } from './_types'
import { cardID, date } from './schema.shared'
import { cardsPerGame } from '../config/game.cfg'
import { runAdapters } from '../../engine/services/model.services'
import { adapterKey } from '../../engine/config/models.cfg'

class GameCards extends Model<GameCard> {
  constructor() {
    super('gamecards', {
      date: { ...date },
      position: { typeStr: 'int', limits: { min: 0, max: cardsPerGame - 1 } },
      cardId: { ...cardID },
    })
    this.isInitialized.then(() => this.custom<void>(`CREATE UNIQUE INDEX IF NOT EXISTS date_position ON ${this.title}(date, position);`))
  }

  getCards(date: GameCard["date"], Cards: Model<Card>): Promise<GameCardJoined[]> {
    return super.custom<GameCardJoined>(
      `SELECT ${Cards.title}.*, position, date FROM ${this.title}
        JOIN ${Cards.title} ON ${Cards.title}.id = ${this.title}.cardId
        WHERE ${this.title}.date = ? ORDER BY date, position ASC;`,
      [date]
    ).then((cards) => Promise.all(cards.map((card) => 
      runAdapters(adapterKey.get, card, Cards.schema, Cards.hidden),
    )))
  }

  removeOlder(date: GameCard["date"]) {
    return super.custom<void>(`DELETE FROM ${this.title} WHERE date < ?`, [date])
  }
}

export default new GameCards()