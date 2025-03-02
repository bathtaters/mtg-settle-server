// Constants
const { config, base } = require('./src.path')
const { staticRootPath } = require('./config/meta')
const urls = require(config+'urls.cfg')
const { trustProxy, preflightCors } = require('./config/server.cfg')
const { guiCSP, jsonPaths } = require(config+'gui.cfg')
const { jsonPaths: userJsonPaths } = require('./config/users.cfg')
// Module Dependencies
const { initMonitoring } = require('./libs/monitor')
const express = require('express')
const { join } = require('path')
const helmet = require('helmet')
const cors = require('cors')
const { initializeServer } = require('./services/init.services')
const customServer = require(base+'server.init')
const { exceptRoute } = require('./utils/common.utils')
// Middleware
const exitMiddleware = require('express-graceful-exit').middleware
const { apiLimiter, guiLimiter } = require('./middleware/rateLimit.middleware')
const authMiddleware = require('./middleware/auth.middleware').initAuth()
const csrfMiddleware  = require('./middleware/csrf.middleware')
const logMiddleware  = require('./middleware/log.middleware')
const errorMiddleware  = require('./middleware/error.middleware')
// Routes
const apiRoutes   = require('./routes/api.routes')
const guiRoutes   = require('./routes/gui.routes')
const adminRoutes = require('./routes/admin.routes')
const rootRoutes  = require('./routes/root.routes')
 

// Server Setup
const server = express()
server.set('trust proxy', trustProxy)
server.set('views', [join(staticRootPath, 'src', 'views'), join(staticRootPath, 'engine', 'views')])
server.set('view engine', 'pug')
if (process.env.NODE_ENV === 'production') server.disable('x-powered-by')
customServer.setup && customServer.setup(server)

// Server-level Middleware
server.use(exitMiddleware(server))
server.use(exceptRoute(urls.api.prefix, helmet({ contentSecurityPolicy: { directives: guiCSP } })))
server.use(urls.api.prefix, helmet())
server.use(express.json())
server.use(express.urlencoded({ extended: false }))
server.use(express.static(join(staticRootPath, 'public')))
server.use('/', express.static(join(staticRootPath, 'public', 'root')))
server.use(express.static(join(staticRootPath, 'engine', 'public')))
server.options(urls.api.prefix+'/*', cors(preflightCors))
server.use(urls.api.prefix, apiLimiter)
server.use(exceptRoute(urls.api.prefix, guiLimiter))
server.use(exceptRoute(urls.api.prefix, authMiddleware))
csrfMiddleware && server.use(exceptRoute(urls.api.prefix, csrfMiddleware))
customServer.middleware && customServer.middleware(server)
server.use(logMiddleware())

// Routes
customServer.routes && customServer.routes(server)
server.use('/',                   rootRoutes)
server.use(urls.api.prefix,       apiRoutes)
server.use(urls.gui.basic.prefix, guiRoutes)
server.use(urls.gui.admin.prefix, adminRoutes)

// Error Handling
initMonitoring(server)
server.use([urls.api.prefix, ...(jsonPaths || []), ...(userJsonPaths || [])], errorMiddleware.json)
server.use(errorMiddleware.html)

// Start server
initializeServer(server)

module.exports = server