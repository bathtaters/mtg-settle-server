const Sentry = require('@sentry/node')
const { nodeProfilingIntegration } = require('@sentry/profiling-node')
const logger = require('./log');
const meta = require('../config/meta');

if (process.env.SENTRY) Sentry.init({
  dsn: process.env.SENTRY,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  release: meta.version,
})

function initMonitoring(server) {
    if (!process.env.SENTRY) return;
    Sentry.setupExpressErrorHandler(server)
    logger.verbose("Monitoring enabled: Sentry")
}

function profileMiddleware(req, res, next) {
    // Start profiler
    Sentry.profiler.startProfiler()
    if (req.user) Sentry.setUser({ id: req.user.id, username: req.user.username })
    else Sentry.setUser(null)

    // Stop profiler whenever route ends
    res.noSentryEnd = res.end
    res.end = (data, enc) => {
        res.noSentryEnd(data, enc)
        Sentry.profiler.stopProfiler()
    }
    const oldNoLog = res.noLogEnd
    if (oldNoLog) res.noLogEnd = (data, enc) => {
        oldNoLog(data, enc)
        Sentry.profiler.stopProfiler()
    }
    return next()
}

const sendError = !process.env.SENTRY ? () => {} : (message, stack, user) => {
    if (user) Sentry.setUser({ id: user.id, username: user.username })
    Sentry.captureException(new Error(message), { extra: { stack } })
}

module.exports = {
    initMonitoring,
    profileMiddleware,
    sendError,
    profile: Sentry.startSpan,
}