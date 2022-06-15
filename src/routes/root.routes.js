const router = require('express').Router()
const controllers = require('../controllers/root.controllers')
const actions = require('../controllers/action.controllers')
const validate = require('../validators/root.validators')
const { root, splashRedirect } = require('../config/meta').urls.gui

router.get( root.logout,                 actions.logout)
router.post(root.login,  validate.login, actions.login)
router.get( root.login,                  controllers.loginPage)

// TO DO -- Make splash page
router.get('/',            (req,res) => res.redirect(root.login))
router.get(splashRedirect, (req,res) => res.redirect('/'))

module.exports = router