const hat = require('hat')
const crypto = require('crypto')
const { encode, rateLimiter } = require('../config/users.cfg')
const failureMsg = require('../config/errors.internal').loginMessages

exports.generateToken = () => hat()

exports.isLocked = ({ failCount }) => (failCount || 0) + 1 >= rateLimiter.maxFails

exports.isPastWindow = ({ failTime, locked }) => failTime && (rateLimiter.autoUnlock || !locked) &&
  (new Date().getTime() - new Date(failTime).getTime() > rateLimiter.failWindow)

const encrypt = (password, salt, iterations, keylen, digest) => new Promise((res, rej) => {
  crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, key) => err ? rej(err) : res(key))
})

exports.encodePassword = async (password) => {
  const salt = crypto.randomBytes(32).toString('base64url')
  const key = await encrypt(password, salt, encode.iters, encode.keylen, encode.digest)
  return { salt, key: key.toString('base64url') }
}

exports.testPassword = (password, accessInt, callback) => async (userData) => {
  if (!userData || !Object.keys(userData).length) return failureMsg.noUser
  if (userData.locked && !exports.isPastWindow(userData)) return failureMsg.isLocked
  if (accessInt && !(userData.access & accessInt)) return failureMsg.noAccess
  if (!userData.key) return failureMsg.noPassword

  const key = await encrypt(password, userData.salt, encode.iters, encode.keylen, encode.digest)
  const isMatch = crypto.timingSafeEqual(Buffer.from(userData.key, 'base64url'), key)

  if (typeof callback === 'function') await callback(isMatch, userData)
  return isMatch ? userData : failureMsg.noMatch
}