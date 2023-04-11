import createError from 'http-errors'
import RegEx from '../../engine/libs/regex'

// export * from '../../engine/config/errors.engine'
export { badKey, noEntry, noData, noID, badAction, badData } from '../../engine/config/errors.engine'

// Common HTTP codes --
//    400: no/invalid data from client
//    401: no/invalid credentials
//    403: no access for client
//    404: page doesn't exist
//    409: conflict with existing entry
//    500: server error
//    502: database error

export const
// Fetch Errors
apolloErr = (errors: readonly any[]) => createError(502, `Apollo Query Error(s)[${errors.length}]: ${errors.map(String).join(', ')}`),
apolloNull = (path: string) => createError(502, `Apollo Query returned null with no error, check objPath ("${path}") is accurate.`),
apolloBad = (val: any, path: string) => createError(502, `Apollo Query returned non-array with no error (${val}), check objPath ("${path}") is accurate.`),
modifyFileId = () => createError(400, 'Card image FileID cannot be modified, only generated or removed.'),
storageError = (msg: any) => createError(502, `ImageKit error: ${JSON.stringify(msg)}`),
gatewayError = (msg: string) => createError(502, msg),

// Manager errors
invalidDateRange = () => createError(400, 'Date must be at one day ahead of today'),

// Games.model errors
gameNotInit = () => createError(500, 'Games table not initialized, wait a second and try again.'),
smallList = (actual: number, expected: number) => createError(500, `List is too small (${actual}) to find ${expected} random entries.`),

// Cards.model Errors
addCardImg = () => createError(400, "Cannot add card and fetch image in same operation. Add card then fetch image."),

// Sets.model Errors
noSets = () => createError(400, 'Must download sets before creating a game.'),
noResSets = () => createError(502, "No sets found in DB, there may be an error with MTGJSON"),

// Shared Errors
parseErr = (data: any) => createError(500, `Unable to parse string: ${data}`),
badType = (expected: string, recieved: any) => createError(400, `Expected "${expected}", recieved "${typeof recieved}"`)