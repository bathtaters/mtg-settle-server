const errors = require('../config/constants/error.messages')

exports.labels = [ 'Add', 'Update', 'Remove', 'Reset' ]

// Actions based on Form submit button label
exports.modelActions = (Model) => ({

  // ADD
  [exports.labels[0]]: async ({ id, ...data }) => {
    if (!data || !Object.keys(data).length) throw errors.noData()
    const newId = await Model.add(data)
    if (!newId) throw errors.noAdd()
  },

  // UPDATE
  [exports.labels[1]]: ({ id, ...data }) => {
    if (id !== 0 && !id) throw errors.noID()
    if (!data || !Object.keys(data).length) throw errors.noData()
    return Model.update(id, data)
  },

  // REMOVE
  [exports.labels[2]]: ({ id }) => {
    if (id !== 0 && !id) throw errors.noID()
    return Model.remove(id)
  },

  // RESET
  [exports.labels[3]]: () => Model.create(true)
})


// Filter function for Object
exports.filterFormData = (formData, filterCb = (val,key) => val) => Object.entries(formData).reduce(
  (filtered, [key, val]) => filterCb(val,key) ? Object.assign(filtered, { [key]: val }) : filtered
, {})