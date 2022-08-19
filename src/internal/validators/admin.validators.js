const Users = require('../models/Users')
const { definitions, searchableKeys } = require('../config/users.cfg')
const { formSettings } = require('../config/settings.cfg')
const { byObject } = require('./shared.validators')
const { page, find, form, formAdditional, token } = require('./gui.validators')
const { formSettingsToValidate } = require('../utils/validate.utils')

let formFields = { confirm: 'password' }
Object.keys(definitions).forEach((field) => { if (definitions[field].html !== false) formFields[field] = field })

module.exports = {
  page, token,
  logs: byObject([{ key: 'filename', typeStr: 'string*', isIn: ['params'] }]),
  settings: byObject(formAdditional.concat(formSettingsToValidate(formSettings, 'body'))),
  find: find(Users, searchableKeys),
  user: (action) => form(Users, action, formFields, searchableKeys),
}
