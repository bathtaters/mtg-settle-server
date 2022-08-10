const session = require('express-session')
const SQLiteStore = require('connect-sqlite3')(session)
const { saveLoginMs } = require('../config/users.cfg')
const { dbPath, isSecure } = require('../../config/meta')
const errors = require('../config/errors.internal')

exports.sessionOptions = {
  name: 'sessionID',
  store: process.env.NODE_ENV === 'test' ? undefined :
    new SQLiteStore({ dir: require('path').dirname(dbPath), db: 'sessions.db' }),
  secret: process.env.SESSION_SECRET || require('../config/settings.cfg').defaults.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: saveLoginMs,
    sameSite: 'strict',
    secure: isSecure,
  },
}

exports.authorizeBearer = (Model, accessLevel) => (token, done) => !token ? done(errors.noToken()) :
  Model.checkToken(token, accessLevel).then((user) => 
    user == null ? done(errors.badToken()) : !user ? done(errors.noAccess()) : done(null, user)
  ).catch(done)

exports.authorizeUser = (Model, accessLevel) => (username, password, done) => 
  Model.checkPassword(username, password, accessLevel).then((user) => {
    if (!user) return done(null, false)
    if (user.fail) return done(null, false, { message: user.fail })
    done(null, user)
  }).catch(done)

exports.storeUser = (Model) => (user, done) => done(null, user[Model.primaryId])
exports.loadUser = (Model, accessStr) => (id, done) => Model.get(id, null, false, accessStr, true).then((user) => 
  done(null, user || false, user ? undefined : errors.noUser())
).catch(done)
