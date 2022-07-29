const { varNameDict, sql2html, MASK_CHAR, boolInputType } = require('../../config/gui.cfg')
const { getTypeArray } = require('../utils/validate.utils')

exports.varName = (str) =>  typeof str !== 'string' ? str : Object.keys(varNameDict).includes(str) ? varNameDict[str] :
  str.charAt(0) === '_' ? exports.varName(str.slice(1)) :
  str.replace(/([A-Z])/g, ' $1').replace(/^./, (ltr) => ltr.toUpperCase())

// Model-specific authorization callback for Form input
exports.formRW = ({ body }) => body.action === 'Search' ? 'read' : 'write'

// Get KEYS from schema
exports.getTableFields = (schema, idKey) => {
  let keys = Object.keys(schema || {})

  // Move ID to start
  const idIdx = keys.map((k) => k.toLowerCase()).indexOf(idKey.toLowerCase())
  if (idIdx > 0) keys.unshift(keys.splice(idIdx,1)[0])

  const tf = keys.reduce((fields, key) => Object.assign(fields, { [key]: exports.varName(key) }), {})
  return tf
}

// Convert Model types to HTML input types
exports.getTypes = (types, idKey) => Object.entries(types).reduce((html, [key, type]) => {
  if (key.toLowerCase() === idKey.toLowerCase()) return html
  switch(getTypeArray(type).type || type) {
    case 'boolean':   html[key] = 'checkbox';       break
    case 'date':      html[key] = 'date';           break
    case 'datetime':  html[key] = 'datetime-local'; break
    case 'int':
    case 'float':     html[key] = 'number';         break
    default:          html[key] = 'text'
  }
  return html
}, {})

// Convert SQLite data types to HTML input types
exports.getSchema = (schema, idKey, boolKeys = []) => Object.entries(schema || {}).reduce((res, [key, val]) =>
  key.toLowerCase() === idKey.toLowerCase() ? res : Object.assign(res, {
    // Key = Field Name: Val = input.type OR schemaType if no matches in sql2html
    [key]: boolKeys.includes(key) ? boolInputType : (sql2html.find(([re]) => re.test(val)) || {1:val})[1]
  })
, {})

exports.mask = (value) => {
  // Recursively mask
  if (Array.isArray(value))
    return value.map(exports.mask)
  if (value && typeof value === 'object')
    return Object.entries(value).reduce((obj,[key,val]) => ({ ...obj, [key]: exports.mask(val) }), {})

  // Mask literals
  switch (typeof value) {
    case 'number':
    case 'bigint': value = value.toString()
    case 'string': return MASK_CHAR.repeat(value.length)
    case 'object':
    case 'undefined': return String(value)
  }
  // Mask others (bool, func, symbol)
  return `[${typeof value}]`
}