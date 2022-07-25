const Users = require('../models/Users')
const definition = require('../config/users.cfg').definitions.types
const { formSettings } = require('../config/settings.cfg')
const { byModel, byObject } = require('./shared.validators')
const { page, find, form, formNoMin, formAdditional } = require('./gui.validators')
const { formSettingsToValidate } = require('../utils/validate.utils')
const { preValidateAdapter } = require('../services/users.services')

const preValidate = (asQueryStr = false, isSearch = false) => (req,res,next) => { preValidateAdapter(asQueryStr ? req.query : req.body, isSearch); next() }

let formFields = { confirm: 'password' }
Object.keys(definition).forEach((field) => { formFields[field] = field })

module.exports = {
  page,
  token: byModel(Users, [Users.primaryId]),
  settings: byObject(formAdditional.concat(formSettingsToValidate(formSettings, 'body'))),
  find: [ preValidate(true, true)  ].concat(find(Users, formFields)),
  form: [ preValidate(false,false) ].concat(form(Users, formFields)),
  formNoMin: [ preValidate(false,true) ].concat(formNoMin(Users, formFields)),
}
