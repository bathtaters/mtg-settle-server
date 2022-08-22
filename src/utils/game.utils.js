const RegEx = require('../internal/libs/regex')
const { isDate, dateISO } = require('../internal/libs/date')

const dateRegex = RegEx(/^\d{4}-\d{2}-\d{2}$/)
const isIsoDate = (date) => typeof date === 'string' && dateRegex.test(date)
exports.normalizeDate = (date) => isIsoDate(date) ? date : dateISO(!isDate(date) ? new Date(date) : date)