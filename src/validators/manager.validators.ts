import { Definition } from '../../engine/models/Model.d'
import { FormHandler, ManagerForm, GameForm } from '../controllers/express'
import { bySchema } from '../../engine/validators/shared.validators'
import { date } from '../models/schema.shared'
import { managerForm, gameForm } from '../config/forms.cfg'

const formAdditional: { [key: string]: Definition } = {
  _action: { typeStr: 'string', limits: { max: 16 } },
  _csrf:   { typeStr: 'string' },
}

export const dateValidator: FormHandler<{ date: string }>[] = bySchema({ date: { ...date } }, ['params', 'body'], false) as any
export const managerValidator: FormHandler<ManagerForm>[] = bySchema({ ...managerForm, ...formAdditional }, ['body'], true) as any // fix to expected RequestHandler
export const gameValidator: FormHandler<GameForm>[] = bySchema({ ...gameForm, ...formAdditional }, ['body'], true) as any