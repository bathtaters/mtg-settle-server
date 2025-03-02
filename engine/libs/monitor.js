const Sentry = require('@sentry/node')
const { nodeProfilingIntegration } = require('@sentry/profiling-node')
const logger = require('./log')

if (process.env.SENTRY) Sentry.init({
  dsn: process.env.SENTRY,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
})

function initMonitoring(server) {
    if (!process.env.SENTRY) return;
    Sentry.setupExpressErrorHandler(server)
    logger.verbose("Monitoring enabled: Sentry")
}

function profileMiddleware(req, res, next) {
    // Start profiler
    Sentry.profiler.startProfiler()

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

module.exports = {
    initMonitoring,
    profileMiddleware,
    profile: Sentry.startSpan,
}