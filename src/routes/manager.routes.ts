import { Router } from 'express'
import { homeController, gameController } from '../controllers/manager.gui'
import { homeForm, gameForm } from '../controllers/manager.actions'
import { gameURL } from '../services/manager.services'
import { checkAuth } from '../../engine/middleware/auth.middleware'
import { isIsoDate } from '../utils/game.utils'
import { access } from '../../engine/config/users.cfg'
import { gui } from '../config/urls.cfg'

const router = Router()

router.use(checkAuth(gui.root.login, access.gui))

router.post(gui.manage.form, homeForm)
router.post(gui.manage.game+gui.manage.form, gameForm)

router.post(gui.manage.game+gui.manage.form,
  (req,res,next) => isIsoDate(req.body.date) ? res.redirect(gameURL(req.params.date || req.body.date)) : next()
)

router.get('/', homeController)
router.get(gui.manage.game+'/:date', gameController)

router.all('*', (req,res) => res.redirect(gui.basic.prefix + gui.manage.prefix))

export default router