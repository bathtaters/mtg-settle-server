import { Router } from 'express'
import Sets from '../models/Sets'
import Cards from '../models/Cards'
import { hasAccess } from '../../engine/utils/users.utils'
import { access } from '../../engine/config/users.cfg'
import { gui } from '../config/urls.cfg'

const router = Router()

router.get('/', (req,res) => Sets.get().then((setList) => res.render('manage', {
  title: 'Management Console',
  // @ts-ignore
  user: req.user.username,
  // @ts-ignore
  isAdmin: hasAccess(req.user.access, access.admin),
  // @ts-ignore
  csrfToken: req.csrfToken && req.csrfToken(),
  setList: setList.filter(({ skip }) => !skip),
  baseURL: gui.basic.prefix + gui.manage.prefix,
})))

router.get(gui.manage.sets, (req,res,next) => {
  return Sets.updateAll(true).then(() => next()).catch(next)
})
router.post(gui.manage.cards, (req,res,next) => {
  if (typeof req.body.setCode !== 'string' || !req.body.setCode) throw new Error("Requires setCode: /cards/<setCode>")
  return Cards.addSet(req.body.setCode.toUpperCase()).then(() => next()).catch(next)
})

router.all('*', (req,res) => res.redirect(gui.basic.prefix + gui.manage.prefix,))

export default router