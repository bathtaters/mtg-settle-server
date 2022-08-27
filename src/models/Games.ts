import Model from '../../engine/models/Model'
import { Feedback } from '../../engine/models/Model.d'
import { Game } from './_types'
import { updateGameSet } from '../services/fetch.services'
import { setCode, date } from './schema.shared'

class Games extends Model<Game> {
  constructor() {
    super('games', {
      date: { isPrimary: true, ...date },
      setCode: { ...setCode },
      art: { typeStr: "string*?", limits: { min: 0, max: 2048 } },
    })
  }

  async add(data: Game): Promise<Game> {
    await updateGameSet(data)
    return super.add(data)
  }

  update(id: Game[keyof Game], data: Game, idKey?: keyof Game): Promise<Feedback> {
    return super.update(id, data, idKey, updateGameSet)
  }
}

export default new Games()