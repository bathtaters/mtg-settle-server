import Model from '../../engine/models/Model'
import { GameCard } from './_types'
import { cardID, date } from './schema.shared'
import { cardsPerGame } from '../config/game.cfg'

class GameCards extends Model<GameCard> {
  constructor() {
    super('gamecards', {
      date: { ...date },
      position: { typeStr: 'int', limits: { min: 0, max: cardsPerGame - 1 } },
      cardId: { ...cardID },
    })
  }

  getPage(page: number, size: number): Promise<GameCard[]> {
    return super.getPage(page, size, true, 'date') // Default sorting
  }
}

export default new GameCards()