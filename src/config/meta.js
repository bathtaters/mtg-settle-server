const { join } = require('path')
const { isCluster, isSecure } = require('../internal/config/server.cfg')
const settings = require('../internal/config/settings.cfg')
const pkg = require('../../package.json')
const pkgCfg = pkg.config || {}

// Set Project Path (NOTE: Update if this file moves!)
const rootPath = join(__dirname,'..','..')
settings.updateRootPath(rootPath)

// Load .ENV file
const envPath = join(rootPath, '.env')
require('dotenv').config({ path: envPath })

// Determine port
function getPort() {
  if (process.env.NODE_ENV === 'test') return require('../internal/testing/test.cfg').port
  return (+process.env.port || +pkgCfg.port || 8080) + (
    isCluster || isNaN(process.env.NODE_APP_INSTANCE) ? 0 : +process.env.NODE_APP_INSTANCE
  )
}

module.exports = {
  name: pkg.name || 'untitled',
  version: pkg.version || '0',
  releaseYear: 2022,

  author: pkg.author.name || pkg.author || 'Unknown',
  license: `https://opensource.org/licenses/${pkg.license || 'BSD-2-Clause'}`,
  repoLink: pkg.repository && pkg.repository.url,

  port: getPort(),
  isPm2: 'NODE_APP_INSTANCE' in process.env,
  isSecure, rootPath, envPath,
  dbPath:  join(process.env.DB_DIR  || settings.defaults.DB_DIR,  'database.db'),
  logPath: join(process.env.LOG_DIR || settings.defaults.LOG_DIR, `${pkg.name || 'server'}_%DATE%.log`),
  credPath: { key: join(rootPath,'.key.pem'), cert: join(rootPath,'.cert.pem') },
}