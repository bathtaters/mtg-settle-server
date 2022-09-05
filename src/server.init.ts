import express from 'express'
import updateRoutes from './routes/manager.routes'
import { pathToUrl } from './libs/storage'
import { gui } from './config/urls.cfg'

function startup(server: express.Application) {
  server.locals.imageUrl = pathToUrl
}

function teardown() {
  // Add code to execute when server begins to shutdown
}

function setup(server: express.Application) {
  // Add custom server settings/run-first middleware: server.set(setting, value)
}

function middleware(server: express.Application) {
  // Add custom middleware: server.use(middleware)
}

function routes(server: express.Application) {
  // Add custom route handlers: server.use(route, routeHandler)
  server.use(gui.basic.prefix+gui.manage.prefix, updateRoutes)
}

export { setup, middleware, routes, startup, teardown }