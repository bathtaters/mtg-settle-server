const Users = require('../models/Users')
const { access, tableFields, tooltips } = require('../config/users.cfg')
const { guiAdapter } = require('../services/users.services')
const { hasAccess } = require('../utils/users.utils')
const { labels } = require('../services/form.services')
const urls = require('../../config/urls.cfg').gui.admin

const staticUserParams = {
  title: 'Users',
  tooltips,
  tableFields,
  idKey: Users.primaryId,
  buttons: labels,
  accessLevels: Object.keys(access),
  limits: Users.limits || {},
  defaults: Users.defaults || {},
  postURL: urls.prefix + urls.user + urls.form,
}
exports.userTable = (req, res, next) => Users.get().then(guiAdapter).then((users) => 
  res.render('users', {
    ...staticUserParams,
    users,
    user: req.user && req.user.username,
    isAdmin: req.user && hasAccess(req.user.access, access.admin),
  })
).catch(next)