import { Feedback } from '../../engine/models/Model.d'
import Model from '../../engine/models/Model'
import { getDb } from '../../engine/libs/db'
import { exec } from '../../engine/services/db.services'
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

  getCards(date: GameCard["date"], Cards: Model<Card>, raw: boolean = false): Promise<GameCardJoined[]> {
    return super.custom<GameCardJoined>(
      `SELECT ${Cards.title}.*, position, date FROM ${this.title}
        JOIN ${Cards.title} ON ${Cards.title}.id = ${this.title}.cardId
        WHERE ${this.title}.date = ? ORDER BY date, position ASC;`,
      [date], raw
    ).then((cards) => raw ? cards : Promise.all(cards.map((card) => 
      runAdapters(adapterKey.get, card, Cards.schema, Cards.hidden),
    )))
  }

  async swapCards(date: GameCard["date"], positionA: GameCard["position"], positionB: GameCard["position"]): Promise<Feedback> {
    await this.custom(`UPDATE ${this.title} SET position = ? WHERE date = ? AND position = ?`, [-1,        date, positionB])
    await this.custom(`UPDATE ${this.title} SET position = ? WHERE date = ? AND position = ?`, [positionB, date, positionA])
    await this.custom(`UPDATE ${this.title} SET position = ? WHERE date = ? AND position = ?`, [positionA, date,        -1])
    return { success: true }
  }

  removeOlder(date: GameCard["date"]) {
    return super.custom<void>(`DELETE FROM ${this.title} WHERE date < ?`, [date])
  }
}

export default new GameCards()