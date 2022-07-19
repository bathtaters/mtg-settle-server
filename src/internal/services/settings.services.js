const { writeFile, readFile } = require('fs/promises')
const { parse } = require('dotenv')
const { getSettingsVars, stringifyEnv, filterOutProps, getChanged } = require('../utils/settings.utils')
const { debounce } = require('../utils/common.utils')
const { defaults, formDefaults, formSettings, fileReadDebounceMs } = require('../config/settings.cfg')
const { envPath } = require('../../config/meta')

const [ debouncedRead, forceNextRead ] = debounce(readFile, { interval: fileReadDebounceMs, ignoreArgs: true })

exports.settingsDefaults = filterOutProps(
  { ...defaults, ...formDefaults },
  Object.entries(formSettings).filter(([_, { readonly }]) => readonly).map(([key]) => key)
)

exports.setSettings = async (settings, session) => {
  const oldSettings = await exports.getSettings()

  if (session) {
    const changes = getChanged(oldSettings, settings)

    if (!Object.keys(changes).length) return
    session.undoSettings = (session.undoSettings || []).concat(changes)
  }
  forceNextRead()
  return writeFile(envPath, stringifyEnv({ ...oldSettings, ...settings }))
}

exports.getSettings = () => debouncedRead(envPath).then((val) => getSettingsVars(Object.keys(formSettings), parse(val.toString())))

exports.canUndo = (session) => session && Array.isArray(session.undoSettings) && session.undoSettings.length

exports.getForm = async () => {
  const newForm = [{}, {}],
    currentVals = await exports.getSettings(),
    splitForm = Math.ceil(Object.keys(formSettings).length / 2)

  Object.keys(formSettings).forEach((key, idx) => {
    if (Array.isArray(formSettings[key].type)) {
      const currentVal = typeof currentVals[key] === 'string' ? currentVals[key] : String(currentVals[key])
      if (currentVal && !formSettings[key].type.includes(currentVal)) 
        formSettings[key].type.push(currentVal)
    }
    newForm[+(idx >= splitForm)][key] = formSettings[key]
  })
  return newForm
}