import Model from '../../engine/models/Model'
import { Feedback } from '../../engine/models/Model.d'
import { CardSet } from './_types'
import { getSetList } from '../services/fetch.services'
import { setCode } from './schema.shared'
import * as errors from '../config/errors'

class Sets extends Model<CardSet> {
  constructor() {
    super('sets', {
      code:  { isPrimary: true, ...setCode },
      name:  { typeStr: "string*", limits: { min: 0, max: 100 } },
      type:  { typeStr: "string",  limits: { min: 0, max:  50 } },
      block: { typeStr: "string*?", limits: { min: 0, max: 100 } },
      skip:  { typeStr: "boolean", default: false },
      releaseDate: { typeStr: "datetime" },
    })
  }

  async updateAll(overwrite: boolean = false): Promise<Feedback> {
    const setList = await getSetList()
    if (!setList.length) throw errors.noResSets()
    return super.batchAdd(setList, overwrite ? 'overwrite' : 'skip')
  }
}

export default new Sets()