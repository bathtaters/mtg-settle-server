// byObject() & byModel() can create custom validation middleware

const { checkSchema } = require('express-validator')
const checkValidation = require('../middleware/validate.middleware')
const { generateSchema, appendToSchema } = require('../services/validate.services')
const { toArraySchema } = require('../utils/validate.utils')
const { filterDupes } = require('../utils/common.utils')

const toMiddleware = (validationSchema) => checkSchema(toArraySchema(validationSchema)).concat(checkSchema(validationSchema)).concat(checkValidation)

/**
 * Get validation middleware using custom options
 * @param {CustomValidation[]} objectArray - array of objects containing custom validation options
 * @returns {function[]} Validation Middleware
 */
exports.byObject = (objectArray) => toMiddleware(appendToSchema({}, objectArray))


/**
 * Fetch validation middleware using associated Model types & limits (also removes any keys in params from body)
 * @param {object} Model - Model instance to generate validation for
 * @param {object} Model.types - Object containing Model schema w/ typeStrings (ie. { key: 'string*[]?', ... })
 * @param {Object.<string, Limits>} [Model.limits] - Object containing keys w/ numeric/size limits
 * @param {string[]|object} [body=[]] - Keys in body: [...keyList] OR { inputField: modelKey, ... } OR 'all' (= All keys in types)
 * @param {object} [options] - Additional options
 * @param {string[]|object} [options.params=[]] - Keys in params: [...keyList] OR { inputKey: modelKey, ... } OR 'all' (= All keys in types)
 * @param {boolean} [options.optionalBody=true] - Make all body/query keys optional (params are unaffected) [default: true]
 * @param {boolean} [options.asQueryStr=false] - Move 'body' validation to 'query' (for GET routes) [default: false]
 * @param {boolean} [options.allowPartials=false] - Allow entering less than the minLength for strings (to validate for searches) [default: false]
 * @param {CustomValidation[]} [options.additional] - Additional validation to append to model validation
 * @returns {function[]} Validation Middleware
 */
exports.byModel = function byModel({ types, limits }, body = [], { params = [], optionalBody = true, asQueryStr = false, allowPartials = false, additional } = {}) {
  let keys = { params, [asQueryStr ? 'query' : 'body']: body }

  // 'all' instead of key array will include validation for all entries
  Object.keys(keys).forEach(t => {
    if (keys[t] === 'all') keys[t] = Object.keys(types)
  })

  // Build list of keys (combining unique)
  let keyList = {}, keysDict = {}
  Object.keys(keys).forEach((inType) => {
    if (!keys[inType]) return

    if (typeof keys[inType] !== 'object') keys[inType] = [keys[inType]]
    else if (!Array.isArray(keys[inType])) {
      Object.assign(keysDict, keys[inType])
      keys[inType] = filterDupes(Object.values(keys[inType]))
    }

    keys[inType].forEach((key) => {
      keyList[key] = keyList[key] ? keyList[key].concat(inType) : [inType]
    })
  })

  // Call getValidation on each entry in keyList to create validationSchema
  const schema = Object.entries(keyList).reduce((valid, [key, isIn]) =>
    Object.assign(valid,
      generateSchema(key, types[key], limits[key], isIn, optionalBody, allowPartials)
    ),
  {})
  if (!Object.keys(keysDict).length) return toMiddleware(appendToSchema(schema, additional))

  // Re-Assign validation names based on input
  let renamedSchema = {}, missing = Object.keys(schema)
  Object.entries(keysDict).forEach((([newKey, oldKey]) => {
    renamedSchema[newKey] = schema[oldKey]

    const oldIdx = missing.indexOf(oldKey)
    if (oldIdx >= 0) missing.splice(oldIdx, 1)
  }))

  // Copy any missed schema
  missing.forEach((key) => { renamedSchema[key] = schema[key] })
  
  // Append 'additional' schema
  return toMiddleware(appendToSchema(renamedSchema, additional))
}






// JSDOC TYPE DEFINITIONS

/**
 * @typedef Limits
 * @type {Object}
 * @property {number} [min] - minimum value/characters/size
 * @property {number} [max] - maximum value/characters/size
 * @property {Limits} [elem] - limits for array elements
 * @property {Limits} [array] - limits for array length
 */
/**
 * @typedef CustomValidation
 * @type {Object}
 * @property {string} key - name of variable being validated
 * @property {string} typeStr - string of variable type (ie. string*[]?)
 * @property {string[]} isIn - location(s) of variable in HTTP request (ie. ['body','params','query'])
 * @property {Limits} [limits] - numeric/size limits (depending on typeStr)
 */