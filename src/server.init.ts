import express, { type RequestHandler } from "express";
import promBundle from "express-prom-bundle";
import { profileMiddleware } from "../engine/libs/monitor";
import clientRoutes from "./routes/game.routes";
import updateRoutes from "./routes/manager.routes";
import { pathToUrl } from "./libs/storage";
import { gui, api } from "./config/urls.cfg";
import { proxyServer } from "./libs/proxy";

function startup(app: express.Application) {
  app.locals.imageUrl = pathToUrl;
}

function teardown() {
  // Add code to execute when server begins to shutdown
}

function setup(app: express.Application) {
  const metricsMiddleware: RequestHandler = promBundle({
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
  }) as any; // Fix middleware type mismatch

  app.use(gui.admin.prefix + gui.admin.metrics, proxyServer());
  app.use(metricsMiddleware);
}

function middleware(app: express.Application) {
  app.use(api.prefix + api.client + "/today", profileMiddleware);
}

function routes(app: express.Application) {
  app.use(api.prefix + api.client, clientRoutes);
  app.use(gui.basic.prefix + gui.manage.prefix, updateRoutes);
}

export { setup, middleware, routes, startup, teardown };
