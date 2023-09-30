const csrf = require('tiny-csrf')
const cookies = require('cookie-parser')
const { csrfEnable } = require('../config/server.cfg')

const secret = (process.env.SESSION_SECRET || require('../config/settings.cfg').definitions.SESSION_SECRET.default)
    .slice(0,32).padEnd(32,'?')

module.exports = csrfEnable && [cookies(secret), csrf(secret)]