import Model from '../../engine/models/Model'
import { Cache } from './_types'

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
    if (typeof data !== 'object') throw new Error(`Expected "object", recieved "${typeof data}"`)
    if (data.error) throw data
    await this.add({ id, data, timestamp: getNow() }, 'overwrite')
  }

  load(id: string) {
    return this.get(id, 'id').then((res) => res && res.data)
  }

  cleanup({ title, custom }: Cached = this) {
    return custom(`DELETE FROM ${title} WHERE ? > timestamp`, [getNow() - oneDay * 2])
  }
}

export default new Cached()