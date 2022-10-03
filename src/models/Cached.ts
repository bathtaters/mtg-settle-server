import Model from '../../engine/models/Model'
import { Cache } from './_types'
import * as errors from '../config/errors'

const oneDay = 24*60*60*1000
const getNow = () => new Date().getTime()

class Cached extends Model<Cache> {
  constructor() {
    super('cache', {
      id:        { typeStr: 'string', isPrimary: true },
      data:      { typeStr: 'object' },
      timestamp: { typeStr: 'int' },
    })

		this.isInitialized.then(() => {
			this.cleanup()
			setInterval(this.cleanup, oneDay, this).unref()
		})
  }

  async store(id: string, data: any) {
    if (typeof data !== 'object') throw errors.badType('object', data)
    if (data.error) throw data
    await this.add({ id, data, timestamp: getNow() }, 'overwrite')
  }

  list() {
    return this.custom<Pick<Cache, 'id'>>(`SELECT ${this.primaryId} FROM ${this.title}`)
      .then((cached) => cached.map(({ id }) => id))
  }

  load(id: string) {
    return this.get(id, 'id').then((res) => res && res.data)
  }

  cleanup({ title, custom }: Cached = this) {
    return custom(`DELETE FROM ${title} WHERE ? > timestamp`, [getNow() - oneDay * 2])
  }
}

export default new Cached()