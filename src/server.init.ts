import type { Server } from "http";
import express from "express";
import { profileMiddleware } from "../engine/libs/monitor";
import clientRoutes from "./routes/game.routes";
import updateRoutes from "./routes/manager.routes";
import { pathToUrl } from "./libs/storage";
import { gui, api } from "./config/urls.cfg";
import { proxyServer, handleUpgrade } from "./libs/proxy";

function startup(app: express.Application, server: Server) {
  app.locals.imageUrl = pathToUrl;
  server.on("upgrade", handleUpgrade);
}

function teardown() {
  // Add code to execute when server begins to shutdown
}

function setup(app: express.Application) {
  // Add custom server settings/run-first middleware: server.set(setting, value)
}

function middleware(app: express.Application) {
  app.use(api.prefix + api.client + "/today", profileMiddleware);
}

function routes(app: express.Application) {
  app.use(api.prefix + api.client, clientRoutes);
  app.use(gui.basic.prefix + gui.manage.prefix, updateRoutes);
  app.use(gui.admin.prefix + gui.admin.metrics, proxyServer());
}

export { setup, middleware, routes, startup, teardown };
