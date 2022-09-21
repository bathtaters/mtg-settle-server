import { Definition } from '../../engine/models/Model.d'
import { FormHandler, ManagerForm, GameForm } from '../controllers/express'
import { byObject } from '../../engine/validators/shared.validators'
import { date } from '../models/schema.shared'
import { managerForm, gameForm } from '../config/forms.cfg'

const formAdditional: { [key: string]: Definition } = {
  _action: { typeStr: 'string', limits: { max: 16 } },
  _csrf:   { typeStr: 'string' },
}

export const dateValidator:    FormHandler<{date: string}>[] = byObject({ date: { ...date } },       ['params', 'body'], { forceOptional: false }) as any
export const managerValidator: FormHandler<ManagerForm>[]    = byObject({ ...managerForm, ...formAdditional }, ['body'], { forceOptional: true  }) as any
export const gameValidator:    FormHandler<GameForm>[]       = byObject({ ...gameForm, ...formAdditional },    ['body'], { forceOptional: true  }) as any