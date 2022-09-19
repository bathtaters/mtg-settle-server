import { Router } from 'express'
import { isIsoDate } from '../libs/date'
import { homeController, gameController } from '../controllers/manager.gui'
import { homeForm, gameForm } from '../controllers/manager.actions'
import { checkAuth } from '../../engine/middleware/auth.middleware'
import { gameURL } from '../services/manager.services'
import { managerValidator, gameValidator } from '../validators/manager.validators'
import { access } from '../../engine/config/users.cfg'
import { gui } from '../config/urls.cfg'

const router = Router()

router.use(checkAuth(gui.root.login, access.gui))

router.post(gui.manage.form, managerValidator, homeForm)
router.post(gui.manage.game+gui.manage.form, gameValidator, gameForm)

router.post(gui.manage.game+gui.manage.form,
  (req,res,next) => isIsoDate(req.body.date) ? res.redirect(gameURL(req.params.date || req.body.date)) : next()
)

router.get('/', homeController)
router.get(gui.manage.game+'/:date', gameController)

router.all('*', (req,res) => res.redirect(gui.basic.prefix + gui.manage.prefix))

export default router