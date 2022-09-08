import Model from '../../engine/models/Model'
import { Game, Card, GameCardJoined } from './_types'
import { Feedback, IfExistsBehavior, ArrayDefinition } from '../../engine/models/Model.d'
import { updateGameSet } from '../services/fetch.services'
import { setCode, date } from './schema.shared'
import { gameCardJoin, swapIndexs } from '../config/sql.constants'
import { cardsPerGame } from '../config/game.cfg'

class Games extends Model<Game> {
  private _cardsTable?: Model<ArrayDefinition<string,string>>
  get cardsTable(): Model<ArrayDefinition<string,string>> {
    if (!this._cardsTable) throw new Error('Games table not initialized, wait a second and try again.')
    return this._cardsTable
  }

  constructor() {
    super('games', {
      date: { isPrimary: true, ...date },
      setCode: { ...setCode },
      art: { typeStr: "string*?", limits: { min: 0, max: 2048 }, isHTML: true },
      cards: { typeStr: "string[]", limits: { array: { min: 0, max: cardsPerGame - 1 } } },
    })
    this.isInitialized.then(() => { this._cardsTable = this.getArrayTable('cards') })
  }

  async add(data: Game, ifExists?: IfExistsBehavior): Promise<Game> {
    await updateGameSet(data)
    return super.add(data, ifExists)
  }

  update(id: Game[keyof Game], data: Partial<Game>, idKey?: keyof Game): Promise<Feedback> {
    return super.update(id, data, idKey, updateGameSet)
  }

  removeOlder(date: Game["date"]) {
    return super.custom<void>(`DELETE FROM ${this.title} WHERE date < ?`, [date])
  }

  getCards(date: Game["date"], Cards: Model<Card>, raw: boolean = false): Promise<GameCardJoined[]> {
    return Cards.custom<GameCardJoined>(gameCardJoin(this.cardsTable.title, Cards.title), [date], raw)
  }

  async swapCards(date: Game["date"], idxA: ArrayDefinition["idx"], idxB: ArrayDefinition["idx"]): Promise<Feedback> {
    await this.custom(swapIndexs(this.cardsTable.title), [ -1,  date, idxB])
    await this.custom(swapIndexs(this.cardsTable.title), [idxB, date, idxA])
    await this.custom(swapIndexs(this.cardsTable.title), [idxA, date,  -1 ])
    return { success: true }
  }

}

export default new Games()