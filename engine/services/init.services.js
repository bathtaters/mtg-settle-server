const http = require("http");
const https = require("https");
const logger = require("../libs/log");
const {
  openServer,
  getCreds,
  addListeners,
  closeHandler,
  errorHandler,
} = require("../utils/init.utils");
const { getDb, openDb, closeDb } = require("../libs/db");
const { varName } = require("../utils/gui.utils");
const rateMw = require("../middleware/rateLimit.middleware");

const { config, base, modelsPath } = require("../src.path");
const {
  useLocalCert,
  closeEvents,
  errorEvents,
} = require("../config/server.cfg");
const { startup, teardown } = require(base + "server.init");
const { title, footer } = require(config + "gui.cfg");
const meta = require("../config/meta");
const urls = require(config + "urls.cfg");
const models = require(modelsPath);

module.exports = {
  isClosing: false,
  isTerminating: false,

  initializeServer: async function initializeServer(app) {
    module.exports.app = app;

    addListeners(closeEvents, closeHandler(module.exports));
    process.env.NODE_ENV !== "production" &&
      addListeners(errorEvents, errorHandler(module.exports));

    // Globals
    app.locals.appTitle = title;
    app.locals.footerData = footer;
    app.locals.varName = varName;
    app.locals.urls = urls;

    // Start services
    if (!getDb()) await openDb();
    await Promise.all(Object.values(models).map((m) => m.isInitialized));
    await rateMw.isInitialized;

    // Get secure credentials
    const creds = await (useLocalCert
      ? getCreds(meta.credPath).then(() =>
          logger.verbose("Loaded secure server credentials"),
        )
      : Promise.resolve(null));

    // Initialize server
    module.exports.listener = creds
      ? https.createServer(creds, app)
      : http.createServer(app);
    if (startup) await startup(app, module.exports.listener);
    logger.info(`${meta.name} services started`);

    // Open port
    await openServer(app, meta, module.exports.listener);
    logger.info(`Listening on port ${meta.port}`);
  },

  terminateServer: async function terminateServer() {
    if (module.exports.isTerminating) return;
    module.exports.isTerminating = true;

    if (teardown) await teardown();

    if (getDb()) await closeDb();

    logger.info(`${meta.name} services ended`);
  },
};
