const Model = require('../../models/Model')
const services = require('../../services/db.services')
const { openDb, getDb } = require('../../libs/db')
const { getPrimaryIdAndAdaptSchema, runAdapters } = require('../../services/model.services')
const { checkInjection, appendAndSort } = require('../../utils/db.utils')
const { caseInsensitiveObject, filterByField } = require('../../utils/common.utils')
const { sanitizeSchemaData, isBool } = require('../../utils/model.utils')
const errors = require('../../config/errors.internal')

const { deepCopy } = require('../test.utils')
const definitions = {
  defId: { type: 'int'     },
  data:  { type: 'boolean' },
  test:  { type: 'string'  },
  bit:   { type: 'int', isBitmap: true },
  obj:   { type: 'object', isArray: true },
}

describe('Model constructor', () => {
  let options
  beforeEach(() => { options = deepCopy(definitions) })
  
  it('sets object props to options', () => {
    const model = new Model('testModel', { ...options })
    expect(model.title).toBe('testModel')
    expect(model.schema).toEqual(options)
    expect(model.primaryId).toBe('defId')
  })
  it('Checks title/primaryId/schema for injection', () => {
    const model = new Model('testModel', { ...options })
    expect(checkInjection).toBeCalledTimes(3)
    expect(checkInjection).toBeCalledWith('testModel')
    expect(checkInjection).toBeCalledWith('defId', model.title)
    expect(checkInjection).toBeCalledWith(options, model.title)
    model.title = 'newTitle'
    expect(checkInjection).toBeCalledTimes(4)
    expect(checkInjection).toBeCalledWith('newTitle')
    model.primaryId = 'newId'
    expect(checkInjection).toBeCalledTimes(5)
    expect(checkInjection).toBeCalledWith('newId', model.title)
    model.schema = { NEW: true, newId: 'ID' }
    expect(checkInjection).toBeCalledTimes(6)
    expect(checkInjection).toBeCalledWith({ NEW: true, newId: 'ID' }, model.title)

  })
  it('uses getPrimaryIdAndAdaptSchema on definitions', () => {
    getPrimaryIdAndAdaptSchema.mockReturnValueOnce('altID')
    const model = new Model('testModel', { ...options })
    expect(getPrimaryIdAndAdaptSchema).toBeCalledTimes(1)
    expect(getPrimaryIdAndAdaptSchema).toBeCalledWith(options, 'testModel')
    expect(model.primaryId).toBe('altID')
  })
  it('isInit resolves to true on success', () => {
    expect.assertions(1)
    return expect(new Model('testModel', { ...options }).isInitialized)
      .resolves.toBe(true)
  })
  it('runs this.create()', () => {
    expect.assertions(1)
    return new Model('testModel', { ...options }).isInitialized.then(() => {
      expect(services.reset).toBeCalledTimes(1)
    })
  })
  it('opens DB if closed', () => {
    expect.assertions(2)
    return new Model('testModel', { ...options }).isInitialized.then(() => {
      expect(openDb).toBeCalledTimes(0)
      getDb.mockReturnValueOnce(null)
      return new Model('testModel', { ...options }).isInitialized.then(() => {
        expect(openDb).toBeCalledTimes(1)
      })
    })
  })
  it('error when no definitions', () => {
    expect(() => new Model('testModel', null)).toThrowError()
  })
})


describe('Model create', () => {
  const TestModel = new Model('testModel', definitions)

  it('calls reset w/ expected args', () => {
    expect.assertions(2)
    filterByField.mockReturnValueOnce('SCHEMA')
    return TestModel.create('force').then(() => {
      expect(services.reset).toBeCalledTimes(1)
      expect(services.reset).toBeCalledWith(
        'DB', { testModel: 'SCHEMA' }, 'force'
      )
    })
  })
  it('expected return on success', () => {
    expect.assertions(1)
    return TestModel.create().then((ret) => {
      expect(ret).toEqual({ success: true })
    })
  })
})


describe('Model get', () => {
  const TestModel = new Model('testModel', definitions)

  it('uses expected SQL', () => {
    expect.assertions(2)
    return TestModel.get('inp','key').then(() => {
      expect(services.get).toBeCalledTimes(1)
      expect(services.get).toBeCalledWith(
        'DB', 'SELECT * FROM testModel WHERE key = ?', ['inp']
      )
    })
  })
  it('gets all when no ID', () => {
    expect.assertions(2)
    return TestModel.get().then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith('DB', 'SELECT * FROM testModel')
    })
  })
  it('uses defaults on missing idKey', () => {
    expect.assertions(1)
    return TestModel.get('inp').then(() => {
      expect(services.get).toBeCalledWith(
        expect.anything(), expect.stringContaining('WHERE defId = ?'), expect.anything()
      )
    })
  })
  it('test idKey for injection', () => {
    expect.assertions(2)
    return TestModel.get('inp','key').then(() => {
      expect(checkInjection).toBeCalledTimes(1)
      expect(checkInjection).toBeCalledWith('key',TestModel.title)
    })
  })
  it('returns result when ID', () => {
    expect.assertions(1)
    return TestModel.get('inp','key').then((ret) => {
      expect(ret).toHaveProperty('val', 'GET')
    })
  })
  it('returns result array when no ID', () => {
    expect.assertions(1)
    return TestModel.get().then((ret) => {
      expect(ret).toEqual(['ALL','RES'])
    })
  })
  it('uses getAdapter', () => {
    expect.assertions(2)
    return TestModel.get('inp','key').then(() => {
      expect(runAdapters).toBeCalledTimes(1)
      expect(runAdapters).toBeCalledWith(
        'get',
        expect.objectContaining({ val: 'GET' }),
        TestModel.schema,
        TestModel.hidden
      )
    })
  })
  it('skips getAdapter when raw = true', () => {
    expect.assertions(1)
    return TestModel.get('inp','key',true).then(() => {
      expect(runAdapters).toBeCalledTimes(0)
    })
  })
  it('returns case-insensitive object', () => {
    caseInsensitiveObject.mockReturnValueOnce('CASEI')
    expect.assertions(2)
    return TestModel.get('inp','key').then((ret) => {
      expect(caseInsensitiveObject).toBeCalledTimes(1)
      expect(ret).toBe('CASEI')
    })
  })
  it('returns case-insensitive object array', () => {
    caseInsensitiveObject.mockReturnValueOnce('CASEI').mockReturnValueOnce('CASEB')
    expect.assertions(2)
    return TestModel.get().then((ret) => {
      expect(caseInsensitiveObject).toBeCalledTimes(2)
      expect(ret).toEqual(['CASEI','CASEB'])
    })
  })
})


describe('Model getPage', () => {
  const TestModel = new Model('testModel', definitions)

  it('uses expected SQL', () => {
    expect.assertions(2)
    return TestModel.getPage(6,12).then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith(
        'DB', 'SELECT * FROM testModel LIMIT ? OFFSET ?',
        [12, 60]
      )
    })
  })
  it('orders result based on input', () => {
    expect.assertions(1)
    return TestModel.getPage(6,12,true,'key').then(() => {
      expect(services.all).toBeCalledWith(
        expect.anything(),
        'SELECT * FROM testModel ORDER BY key DESC LIMIT ? OFFSET ?',
        [12, 60]
      )
    })
  })
  it('uses default on missing orderKey', () => {
    expect.assertions(1)
    return TestModel.getPage(6,12,false).then(() => {
      expect(services.all).toBeCalledWith(
        expect.anything(),
        expect.stringContaining('ORDER BY defId ASC'),
        expect.any(Array)
      )
    })
  })
  it('test orderKey for injection', () => {
    expect.assertions(2)
    return TestModel.getPage(6,12,false,'key').then(() => {
      expect(checkInjection).toBeCalledTimes(1)
      expect(checkInjection).toBeCalledWith('key',TestModel.title)
    })
  })
  it('returns result array on success', () => {
    expect.assertions(1)
    return TestModel.getPage(6,12).then((ret) => {
      expect(ret).toEqual(['ALL','RES'])
    })
  })
  it('uses getAdapter', () => {
    expect.assertions(3)
    return TestModel.getPage(6,12).then(() => {
      expect(runAdapters).toBeCalledTimes(2)
      expect(runAdapters).toBeCalledWith('get', 'ALL', TestModel.schema, TestModel.hidden)
      expect(runAdapters).toBeCalledWith('get', 'RES', TestModel.schema, TestModel.hidden)
    })
  })
  it('returns case-insensitive objects', () => {
    caseInsensitiveObject.mockReturnValueOnce('CASEI').mockReturnValueOnce('CASEB')
    expect.assertions(2)
    return TestModel.getPage(6,12).then((ret) => {
      expect(caseInsensitiveObject).toBeCalledTimes(2)
      expect(ret).toEqual(['CASEI','CASEB'])
    })
  })
  it('rejects on missing size', () => {
    expect.assertions(1)
    return TestModel.getPage(6).catch((err) => {
      expect(err).toEqual(errors.noSize())
    })
  })
})


describe('Model find', () => {
  const TestModel = new Model('testModel', definitions)

  it('uses expected SQL', () => {
    expect.assertions(2)
    return TestModel.find({ data: 1, test: 2 }).then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith(
        'DB', 'SELECT * FROM testModel WHERE data = ? AND test = ?', [1, 2]
      )
    })
  })
  it('allows partial match', () => {
    expect.assertions(2)
    return TestModel.find({ data: '1' }, true).then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith(
        expect.anything(), expect.stringContaining('WHERE data LIKE ?'), ['%1%']
      )
    })
  })
  it('allows partial bitmap match', () => {
    expect.assertions(2)
    return TestModel.find({ bit: 3 }, true).then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith(
        expect.anything(), expect.stringContaining('WHERE bit & ?'), [3]
      )
    })
  })
  it('partial bitmap matches zero', () => {
    expect.assertions(2)
    return TestModel.find({ bit: 0 }, true).then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith(
        expect.anything(), expect.stringContaining('WHERE bit = ?'), [0]
      )
    })
  })
  it('partial boolean converts to int', () => {
    expect.assertions(2)
    isBool.mockReturnValueOnce(true)
    return TestModel.find({ data: true }, true).then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith(
        expect.anything(), expect.stringContaining('WHERE data = ?'), [1]
      )
    })
  })
  it('forces exact match on number', () => {
    expect.assertions(2)
    return TestModel.find({ test: 7 }, true).then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith(
        expect.anything(), expect.stringContaining('WHERE test = ?'), [7]
      )
    })
  })
  it('forces exact match on null', () => {
    expect.assertions(2)
    return TestModel.find({ data: null }, true).then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith(
        expect.anything(), expect.stringContaining('WHERE data = ?'), [null]
      )
    })
  })
  it('forces exact match to stringified object/array', () => {
    expect.assertions(2)
    return TestModel.find({ obj: [{a:1,b:2},{c:3}] }, true).then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith(
        expect.anything(), expect.stringContaining('WHERE obj = ?'), ['[{"a":1,"b":2},{"c":3}]']
      )
    })
  })
  it('returns result array on success', () => {
    expect.assertions(1)
    return TestModel.find({ data: 1 }).then((ret) => {
      expect(ret).toEqual(['ALL','RES'])
    })
  })
  it('uses set/getAdapters', () => {
    expect.assertions(4)
    return TestModel.find({ data: 1 }).then(() => {
      expect(runAdapters).toBeCalledTimes(3)
      expect(runAdapters).toBeCalledWith('get', 'ALL', TestModel.schema, TestModel.hidden)
      expect(runAdapters).toBeCalledWith('get', 'RES', TestModel.schema, TestModel.hidden)
      expect(runAdapters).toBeCalledWith('set', {data: 1}, TestModel.schema)
    })
  })
  it('sanitizes input data', () => {
    expect.assertions(2)
    return TestModel.find({ data: 1 }).then(() => {
      expect(sanitizeSchemaData).toBeCalledTimes(1)
      expect(sanitizeSchemaData).toBeCalledWith({ data: 1 }, TestModel.schema)
    })
  })
  it('returns case-insensitive objects', () => {
    caseInsensitiveObject.mockReturnValueOnce('CASEI').mockReturnValueOnce('CASEB')
    expect.assertions(2)
    return TestModel.find({ data: 1 }).then((ret) => {
      expect(caseInsensitiveObject).toBeCalledTimes(2)
      expect(ret).toEqual(['CASEI','CASEB'])
    })
  })
  it('rejects on no data', () => {
    expect.assertions(1)
    return TestModel.find({}).catch((err) => {
      expect(err).toEqual(errors.noData())
    })
  })
})


describe('Model count', () => {
  const TestModel = new Model('testModel', definitions)

  it('uses expected SQL', () => {
    expect.assertions(2)
    return TestModel.count('inp','key').then(() => {
      expect(services.get).toBeCalledTimes(1)
      expect(services.get).toBeCalledWith(
        'DB',
        expect.stringMatching(/SELECT COUNT\([^)]+\) \w+ FROM testModel WHERE key = \?/),
        ['inp']
      )
    })
  })
  it('gets all when no ID', () => {
    expect.assertions(2)
    return TestModel.count().then(() => {
      expect(services.get).toBeCalledTimes(1)
      expect(services.get).toBeCalledWith(
        'DB', expect.stringMatching(/SELECT COUNT\([^)]+\) \w+ FROM testModel/), []
      )
    })
  })
  it('uses defaults on missing idKey', () => {
    expect.assertions(1)
    return TestModel.count('inp').then(() => {
      expect(services.get).toBeCalledWith(
        expect.anything(), expect.stringContaining('WHERE defId = ?'), expect.anything()
      )
    })
  })
  it('test idKey for injection', () => {
    expect.assertions(2)
    return TestModel.count('inp','key').then(() => {
      expect(checkInjection).toBeCalledTimes(1)
      expect(checkInjection).toBeCalledWith('key',TestModel.title)
    })
  })
  it('returns count on success', () => {
    expect.assertions(1)
    return TestModel.count().then((ret) => {
      expect(ret).toBe(15)
    })
  })
})


describe('Model add', () => {
  const TestModel = new Model('testModel', definitions)
  beforeEach(() => { TestModel._defaults = { data: 'DEFAULT' } })

  it('uses expected SQL', () => {
    expect.assertions(2)
    return TestModel.add({ data: 1, test: 2 }).then(() => {
      expect(services.getLastId).toBeCalledTimes(1)
      expect(services.getLastId).toBeCalledWith(
        'DB', 'INSERT INTO testModel(data,test) VALUES(?,?)', [1,2]
      )
    })
  })
  it('uses defaults on missing input fields', () => {
    expect.assertions(1)
    return TestModel.add({}).then(() => {
      expect(services.getLastId).toBeCalledWith(
        expect.anything(),
        expect.stringContaining('(data)'),
        ['DEFAULT']
      )
    })
  })
  it('returns LastId on success', () => {
    expect.assertions(1)
    return TestModel.add({ data: 1 }).then((ret) => {
      expect(ret).toBe('LAST_ID')
    })
  })
  it('uses setAdapter on input', () => {
    expect.assertions(2)
    return TestModel.add({ data: 1 }).then(() => {
      expect(runAdapters).toBeCalledTimes(1)
      expect(runAdapters).toBeCalledWith('set', { data: 1 }, TestModel.schema)
    })
  })
  it('sanitizes input data', () => {
    expect.assertions(2)
    return TestModel.add({ data: 1 }).then(() => {
      expect(sanitizeSchemaData).toBeCalledTimes(1)
      expect(sanitizeSchemaData).toBeCalledWith({ data: 1 }, TestModel.schema)
    })
  })
  it('rejects on no data & no defaults', () => {
    expect.assertions(1)
    TestModel._defaults = {}
    return TestModel.add({}).catch((err) => {
      expect(err).toEqual(errors.noData())
    })
  })
})


describe('Model update', () => {
  // NOTE: Requires service.get() in Model.count() to return truthy (See mock below)
  const TestModel = new Model('testModel', definitions)

  it('uses expected SQL', () => {
    expect.assertions(2)
    return TestModel.update('inp', { data: 1, test: 2 }, 'key').then(() => {
      expect(services.run).toBeCalledTimes(1)
      expect(services.run).toBeCalledWith(
        'DB', 'UPDATE testModel SET data = ?, test = ? WHERE key = ?', [1, 2, 'inp']
      )
    })
  })
  it('uses default on missing idKey', () => {
    expect.assertions(1)
    return TestModel.update('inp', { data: 1 }).then(() => {
      expect(services.run).toBeCalledWith(
        expect.anything(), expect.stringContaining('WHERE defId = ?'), expect.anything()
      )
    })
  })
  it('test idKey for injection', () => {
    expect.assertions(2)
    return TestModel.update('inp', { data: 1 }, 'key').then(() => {
      expect(checkInjection).toBeCalledTimes(1)
      expect(checkInjection).toBeCalledWith('key',TestModel.title)
    })
  })
  it('expected return on success', () => {
    expect.assertions(1)
    return TestModel.update('inp', { data: 1 }, 'key').then((ret) => {
      expect(ret).toEqual({ success: true })
    })
  })
  it('uses setAdapter on data', () => {
    expect.assertions(2)
    return TestModel.update('inp', { data: 1 }, 'key').then(() => {
      expect(runAdapters).toBeCalledTimes(1)
      expect(runAdapters).toBeCalledWith('set', { data: 1 }, TestModel.schema)
    })
  })
  it('sanitizes input data', () => {
    expect.assertions(2)
    return TestModel.update('inp', { data: 1 }, 'key').then(() => {
      expect(sanitizeSchemaData).toBeCalledTimes(1)
      expect(sanitizeSchemaData).toBeCalledWith({ data: 1 }, TestModel.schema)
    })
  })
  it('calls changeCb with before/after data', () => {
    expect.assertions(4)
    const callback = jest.fn()
    services.get.mockResolvedValueOnce({ data: 'old' })
    return TestModel.update('inp', { data: 'new' }, 'key', callback).then(() => {
      expect(callback).toBeCalledTimes(1)
      expect(callback).toBeCalledWith({ data: 'new' }, { data: 'old' })
      expect(runAdapters).toBeCalledTimes(1)
      expect(runAdapters).not.toBeCalledWith('get',expect.anything(),expect.anything())
    })
  })
  it('passes changeCb result to SQL', () => {
    expect.assertions(2)
    const callback = jest.fn(() => ({ changedKey: 'changedVal' }))
    return TestModel.update('inp', { data: 1 }, 'key', callback).then(() => {
      expect(services.run).toBeCalledTimes(1)
      expect(services.run).toBeCalledWith(
        expect.anything(),
        expect.stringContaining('changedKey'),
        expect.arrayContaining(['changedVal'])
      )
    })
  })
  it('uses original data if changeCb returns falsy', () => {
    expect.assertions(2)
    const callback = jest.fn()
    return TestModel.update('inp', { inputKey: 'inputVal' }, 'key', callback).then(() => {
      expect(services.run).toBeCalledTimes(1)
      expect(services.run).toBeCalledWith(
        expect.anything(),
        expect.stringContaining('inputKey'),
        expect.arrayContaining(['inputVal'])
      )
    })
  })
  it('re-sanitizes data after onChangeCb', () => {
    expect.assertions(2)
    const callback = jest.fn(() => ({ newData: 'newVal' }))
    return TestModel.update('inp', { inputKey: 'inputVal' }, 'key', callback).then(() => {
      expect(sanitizeSchemaData).toBeCalledTimes(2)
      expect(sanitizeSchemaData).toBeCalledWith({ newData: 'newVal' }, TestModel.schema)
    })
  })
  it('rejects on missing ID', () => {
    expect.assertions(1)
    return TestModel.update(null, { data: 1 }, 'key').catch((err) => {
      expect(err).toEqual(errors.noID())
    })
  })
  it('rejects on no data', () => {
    expect.assertions(1)
    return TestModel.update('inp', {}, 'key').catch((err) => {
      expect(err).toEqual(errors.noData())
    })
  })
  it('rejects on ID not found', () => {
    services.get.mockResolvedValueOnce({})
    expect.assertions(1)
    return TestModel.update('inp', { data: 1}, 'key').catch((err) => {
      expect(err).toEqual(errors.noEntry('inp'))
    })
  })
})


describe('Model remove', () => {
  // NOTE: Requires service.get() in Model.count() to return truthy (See mock below)
  const TestModel = new Model('testModel', definitions)

  it('uses expected SQL', () => {
    expect.assertions(2)
    return TestModel.remove('inp','key').then(() => {
      expect(services.run).toBeCalledTimes(1)
      expect(services.run).toBeCalledWith(
        'DB', 'DELETE FROM testModel WHERE key = ?', ['inp']
      )
    })
  })
  it('uses default on missing idKey', () => {
    expect.assertions(1)
    return TestModel.remove('inp').then(() => {
      expect(services.run).toBeCalledWith(
        expect.anything(), expect.stringContaining('WHERE defId = ?'), expect.anything()
      )
    })
  })
  it('test idKey for injection', () => {
    expect.assertions(2)
    return TestModel.remove('inp', 'key').then(() => {
      expect(checkInjection).toBeCalledTimes(1)
      expect(checkInjection).toBeCalledWith('key',TestModel.title)
    })
  })
  it('expected return on success', () => {
    expect.assertions(1)
    return TestModel.remove('inp','key').then((ret) => {
      expect(ret).toEqual({ success: true })
    })
  })
  it('rejects on missing ID', () => {
    expect.assertions(1)
    return TestModel.remove(null, 'key').catch((err) => {
      expect(err).toEqual(errors.noID())
    })
  })
  it('rejects on ID not found', () => {
    services.get.mockResolvedValueOnce({})
    expect.assertions(1)
    return TestModel.remove('inp', 'key').catch((err) => {
      expect(err).toEqual(errors.noEntry('inp'))
    })
  })
})


describe('Model custom', () => {
  const TestModel = new Model('testModel', definitions)

  it('uses input SQL', () => {
    expect.assertions(2)
    return TestModel.custom('SQL','PARAMS',false).then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith('DB', 'SQL', expect.anything())
    })
  })
  it('uses input PARAMS', () => {
    expect.assertions(2)
    return TestModel.custom('SQL','PARAMS',false).then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith('DB', expect.anything(), 'PARAMS')
    })
  })
  it('returns result array on success', () => {
    expect.assertions(1)
    return TestModel.custom('SQL','PARAMS',false).then((ret) => {
      expect(ret).toEqual(['ALL','RES'])
    })
  })
  it('uses getAdapter', () => {
    expect.assertions(3)
    return TestModel.custom('SQL','PARAMS',false).then(() => {
      expect(runAdapters).toBeCalledTimes(2)
      expect(runAdapters).toBeCalledWith('get', 'ALL', TestModel.schema, TestModel.hidden)
      expect(runAdapters).toBeCalledWith('get', 'RES', TestModel.schema, TestModel.hidden)
    })
  })
  it('skips getAdapter when raw = true', () => {
    expect.assertions(1)
    return TestModel.custom('SQL','PARAMS',true).then(() => {
      expect(runAdapters).toBeCalledTimes(0)
    })
  })
  it('returns case-insensitive objects', () => {
    caseInsensitiveObject.mockReturnValueOnce('CASEI').mockReturnValueOnce('CASEB')
    expect.assertions(2)
    return TestModel.custom('SQL','PARAMS',false).then((ret) => {
      expect(caseInsensitiveObject).toBeCalledTimes(2)
      expect(ret).toEqual(['CASEI','CASEB'])
    })
  })
})


describe('Model getPaginationData', () => {
  // NOTE: Requires service.get() in Model.count() to return > page*size (See mock below)
  const TestModel = new Model('testModel', definitions)
  
  let input, options
  beforeEach(() => {
    input = { page: 3, size: 4 }
    options = { defaultSize: 5, sizeList: [2,4,6], startPage: 1 }
  })

  it('passes size to return', () => {
    expect.assertions(1)
    return TestModel.getPaginationData(input, options).then(({ size }) => {
      expect(size).toBe(4)
    })
  })
  it('passes page to return if in range', () => {
    expect.assertions(1)
    return TestModel.getPaginationData(input, options).then(({ page }) => {
      expect(page).toBe(3)
    })
  })
  it('calculates pageCount using Model.count', () => {
    services.get.mockResolvedValueOnce({ c: 48 }) // Model.count => 48
    expect.assertions(1)
    return TestModel.getPaginationData(input, options).then(({ pageCount }) => {
      expect(pageCount).toBe(12)
    })
  })
  it('returns sorted sizeList w/ size appended', () => {
    appendAndSort.mockImplementationOnce(() => 'SORTED')
    expect.assertions(2)
    return TestModel.getPaginationData(input, options).then(({ sizes }) => {
      expect(sizes).toBe('SORTED')
      expect(appendAndSort).toBeCalledWith([2, 4, 6], 4)
    })
  })
  it('uses Model.getPage to return data', () => {
    expect.assertions(3)
    return TestModel.getPaginationData(input, options).then(({ data }) => {
      expect(data).toEqual(['ALL','RES'])
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith(
        // Model.getPage(page:3, size:4) (LIMIT = size, OFFSET = (page - 1) * size)
        expect.anything(), expect.stringContaining('LIMIT ? OFFSET ?'),
        expect.arrayContaining([4,8])
      )
    })
  })

  it('uses startPage when no page', () => {
    input.page = undefined
    options.startPage = 2
    expect.assertions(1)
    return TestModel.getPaginationData(input, options).then(({ page }) => {
      expect(page).toBe(2)
    })
  })
  it('limits page to min 1', () => {
    input.page = -12
    expect.assertions(1)
    return TestModel.getPaginationData(input, options).then(({ page }) => {
      expect(page).toBe(1)
    })
  })
  it('limits page to max pageCount', () => {
    services.get.mockResolvedValueOnce({ c: 7 }) // Model.count => 7
    expect.assertions(1)
    return TestModel.getPaginationData(input, options).then(({ page }) => {
      expect(page).toBe(2)
    })
  })
  it('uses defaultSize when no size', () => {
    input.size = undefined
    expect.assertions(1)
    return TestModel.getPaginationData(input, options).then(({ size }) => {
      expect(size).toBe(5)
    })
  })
  it('no sizes if pageCount = 1 & total <= all sizes', () => {
    input.size = 6
    options.sizeList = [10, 15, 20]
    services.get.mockResolvedValueOnce({ c: 5 }) // Model.count => 5
    expect.assertions(1)
    return TestModel.getPaginationData(input, options).then(({ sizes }) => {
      expect(sizes).toBeFalsy()
    })
  })
})



/* --- MOCKS --- */

jest.mock('../../libs/db', () => ({
  getDb: jest.fn(() => 'DB'), openDb: jest.fn().mockResolvedValue(true)
}))

jest.mock('../../services/db.services', () => ({
  run:       jest.fn((db) => db ? Promise.resolve() : Promise.reject('No DB')),
  get:       jest.fn((db) => db ? Promise.resolve({ val: 'GET', c: 15 }) : Promise.reject('No DB')),
  all:       jest.fn((db) => db ? Promise.resolve(['ALL','RES']) : Promise.reject('No DB')),
  getLastId: jest.fn((db) => db ? Promise.resolve('LAST_ID') : Promise.reject('No DB')),
  reset:     jest.fn((db) => db ? Promise.resolve() : Promise.reject('No DB')),
}))

jest.mock('../../services/model.services', () => ({
  getPrimaryIdAndAdaptSchema: jest.fn(() => 'defId'),
  runAdapters: jest.fn((_,data) => data),
}))

jest.mock('../../utils/db.utils', () => ({
  checkInjection: jest.fn((o) => o),
  appendAndSort: jest.fn((list) => list),
}))

jest.mock('../../utils/common.utils', () => ({
  caseInsensitiveObject: jest.fn((o) => o),
  filterByField: jest.fn((o) => o),
}))

jest.mock('../../utils/model.utils', () => ({
  isBool: jest.fn(() => false),
  sanitizeSchemaData: jest.fn((o) => o),
}))

jest.mock('../../utils/validate.utils', () => ({ parseBoolean: () => (val) => !!val }))
jest.mock('../../config/models.cfg', () => ({ adapterKey: { get: 'get', set: 'set' } }))