import Model from '../../engine/models/Model'
import { Feedback } from '../../engine/models/Model.d'
import { CardSet } from './_types'
import { getSetList } from '../services/fetch.services'
import { setCode } from './schema.shared'

class Sets extends Model<CardSet> {
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

  async updateAll(): Promise<Feedback> {
    const setList = await getSetList()
    return super.batchAdd(setList, 'skip')
  }
}

export default new Sets()