const createError = require('http-errors')
const internalErrors = require(require('../engine.path').config+'errors.engine')

// Common HTTP codes --
//    400: no/invalid data from client
//    401: no/invalid credentials
//    403: no access for client
//    404: page doesn't exist
//    409: conflict with existing entry
//    500: server error
//    502: database error

module.exports = {
  ...internalErrors,

  // Cards.model Errors
  addCardImg: () => createError(400, "Cannot add card and fetch image in same operation. Add card then fetch image."),
}