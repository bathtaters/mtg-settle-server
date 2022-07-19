const Model = require('../../models/Model')
const services = require('../../services/db.services')
const { openDb, getDb } = require('../../config/db')
const { hasDupes, caseInsensitiveObject } = require('../../utils/common.utils')
const { deepUnescape } = require('../../utils/validate.utils')
const { sanitizeSchemaData, schemaFromConfig, appendAndSort } = require('../../utils/db.utils')
const errors = require('../../config/errors.internal')

const { deepCopy } = require('../test.utils')
const { object } = require('../../config/validate.messages')
const modelOptions = {
  schema: { SCHEMA: true, defId: 'ID' },
  defaults: { data: 'DEFAULT' },
  limits: 'LIMITS',
  primaryId: 'defId',
  getAdapter: jest.fn((val) => val),
  setAdapter: jest.fn((val) => val),
}

describe('Model constructor', () => {
  let options
  beforeEach(() => { options = deepCopy(modelOptions) })

  it('sets object props to options', () => {
    const model = new Model('test', { ...options })
    expect(model.title).toBe('test')
    expect(model.schema).toEqual({ SCHEMA: true, defId: 'ID' })
    expect(model.defaults).toEqual({ data: 'DEFAULT' })
    expect(model.limits).toBe('LIMITS')
    expect(model.primaryId).toBe('defId')
    expect(model.getAdapter).toBe(options.getAdapter)
    expect(model.setAdapter).toBe(options.setAdapter)
  })
  it('runs sanitizeSchemaData on schema', () => {
    new Model('test', { ...options })
    expect(sanitizeSchemaData).toBeCalledTimes(1)
    expect(sanitizeSchemaData).toBeCalledWith({ SCHEMA: true, defId: 'ID' })
  })
  it('uses schemaFromConfig when no schema', () => {
    new Model('test', { ...options })
    expect(schemaFromConfig).toBeCalledTimes(0)
    expect(new Model('test', { ...options, schema: null }).schema)
      .toEqual({ config: 'SCHEMA', defId: expect.any(String) })
    expect(schemaFromConfig).toBeCalledTimes(1)
    expect(schemaFromConfig).toBeCalledWith('test', 'defId')
  })
  it('uses schema(schemaFromConfig) when schema is function', () => {
    const schema = jest.fn((sch) => sch)
    new Model('test', { ...options, schema })
    expect(schema).toBeCalledTimes(1)
    expect(schema).toBeCalledWith(
      { config: 'SCHEMA', defId: expect.any(String) },
      'test', 'defId'
    )
  })
  it('checks schema for duplicate keys (case-insensitive)', () => {
    new Model('test', { ...options })
    expect(hasDupes).toBeCalledTimes(1)
    expect(hasDupes).toBeCalledWith(['schema', 'defid'])
  })
  it('auto-creates primaryID if not in schema', () => {
    expect(new Model('test', { ...options, primaryId: 'test' }).schema)
      .toHaveProperty('test', expect.stringContaining('PRIMARY KEY'))
  })
  it('uses config defaults/limits when not provided', () => {
    const model = new Model('test', { ...options, defaults: null, limits: null })
    expect(model.defaults).toBe('CFGDEFS')
    expect(model.limits).toBe('CFGLIMS')
  })
  it('ignores non-function get/setAdapters', () => {
    const model = new Model('test', { ...options, getAdapter: 'test', setAdapter: 12 })
    expect(model.getAdapter).toBeFalsy()
    expect(model.setAdapter).toBeFalsy()
  })
  it('isInit resolves to true on success', () => {
    expect.assertions(1)
    return expect(new Model('test', { ...options }).isInitialized)
      .resolves.toBe(true)
  })
  it('runs this.create()', () => {
    expect.assertions(1)
    return new Model('test', { ...options }).isInitialized.then(() => {
      expect(services.reset).toBeCalledTimes(1)
    })
  })
  it('opens DB if closed', () => {
    expect.assertions(2)
    return new Model('test', { ...options }).isInitialized.then(() => {
      expect(openDb).toBeCalledTimes(0)
      getDb.mockReturnValueOnce(null)
      return new Model('test', { ...options }).isInitialized.then(() => {
        expect(openDb).toBeCalledTimes(1)
      })
    })
  })
  it('error when no schema and no schemaFromConfig', () => {
    expect(() => new Model('test', { ...options, schema: null })).not.toThrowError()
    schemaFromConfig.mockReturnValueOnce(null)
    expect(() => new Model('test', { ...options, schema: null })).toThrowError()
  })
  it('error when duplicate keys in schema', () => {
    expect(() => new Model('test', { ...options })).not.toThrowError()
    hasDupes.mockReturnValueOnce(true)
    expect(() => new Model('test', { ...options })).toThrowError()
  })
})


describe('Model create', () => {
  const TestModel = new Model('test', modelOptions)

  it('calls reset w/ expected args', () => {
    expect.assertions(2)
    return TestModel.create('force').then(() => {
      expect(services.reset).toBeCalledTimes(1)
      expect(services.reset).toBeCalledWith(
        'DB',
        { 'test': { SCHEMA: true, defId: 'ID' } },
        'force'
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
  const TestModel = new Model('test', modelOptions)

  it('uses expected SQL', () => {
    expect.assertions(2)
    return TestModel.get('inp','key').then(() => {
      expect(services.get).toBeCalledTimes(1)
      expect(services.get).toBeCalledWith(
        'DB', 'SELECT * FROM test WHERE key = ?', ['inp']
      )
    })
  })
  it('gets all when no ID', () => {
    expect.assertions(2)
    return TestModel.get().then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith('DB', 'SELECT * FROM test')
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
      expect(modelOptions.getAdapter).toBeCalledTimes(1)
      expect(modelOptions.getAdapter).toHaveBeenNthCalledWith(1, expect.objectContaining({ val: 'GET' }))
    })
  })
  it('skips getAdapter when raw = true', () => {
    expect.assertions(1)
    return TestModel.get('inp','key',true).then(() => {
      expect(modelOptions.getAdapter).toBeCalledTimes(0)
    })
  })
  it('unescapes return value', () => {
    deepUnescape.mockReturnValueOnce('UNESC')
    expect.assertions(2)
    return TestModel.get('inp','key').then((ret) => {
      expect(deepUnescape).toBeCalledTimes(1)
      expect(ret).toBe('UNESC')
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
  const TestModel = new Model('test', modelOptions)

  it('uses expected SQL', () => {
    expect.assertions(2)
    return TestModel.getPage(6,12).then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith(
        'DB', 'SELECT * FROM test LIMIT 12 OFFSET 60'
      )
    })
  })
  it('orders result based on input', () => {
    expect.assertions(1)
    return TestModel.getPage(6,12,true,'key').then(() => {
      expect(services.all).toBeCalledWith(
        expect.anything(),
        'SELECT * FROM test ORDER BY key DESC LIMIT 12 OFFSET 60'
      )
    })
  })
  it('uses default on missing orderKey', () => {
    expect.assertions(1)
    return TestModel.getPage(6,12,false).then(() => {
      expect(services.all).toBeCalledWith(
        expect.anything(),
        expect.stringContaining('ORDER BY defId ASC')
      )
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
      expect(modelOptions.getAdapter).toBeCalledTimes(2)
      expect(modelOptions.getAdapter).toHaveBeenNthCalledWith(1, 'ALL', 0, ['ALL','RES'])
      expect(modelOptions.getAdapter).toHaveBeenNthCalledWith(2, 'RES', 1, ['ALL','RES'])
    })
  })
  it('unescapes return value', () => {
    deepUnescape.mockReturnValueOnce(['UNESC'])
    expect.assertions(2)
    return TestModel.getPage(6,12).then((ret) => {
      expect(deepUnescape).toBeCalledTimes(1)
      expect(ret).toEqual(['UNESC'])
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
  const TestModel = new Model('test', modelOptions)

  it('uses expected SQL', () => {
    expect.assertions(2)
    return TestModel.find({ data: 1, test: 2 }).then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith(
        'DB', 'SELECT * FROM test WHERE data = ? AND test = ?', [1, 2]
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
    TestModel.bitmapFields.push('bitMap')
    expect.assertions(2)
    return TestModel.find({ bitMap: 3 }, true).then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith(
        expect.anything(), expect.stringContaining('WHERE bitMap & ?'), [3]
      )
      TestModel.bitmapFields.pop()
    })
  })
  it('partial bitmap matches zero', () => {
    TestModel.bitmapFields.push('bitMap')
    expect.assertions(2)
    return TestModel.find({ bitMap: 0 }, true).then(() => {
      expect(services.all).toBeCalledTimes(1)
      expect(services.all).toBeCalledWith(
        expect.anything(), expect.stringContaining('WHERE bitMap = ?'), [0]
      )
      TestModel.bitmapFields.pop()
    })
  })
  it('returns result array on success', () => {
    expect.assertions(1)
    return TestModel.find({ data: 1 }).then((ret) => {
      expect(ret).toEqual(['ALL','RES'])
    })
  })
  it('uses set/getAdapters', () => {
    expect.assertions(5)
    return TestModel.find({ data: 1 }).then(() => {
      expect(modelOptions.getAdapter).toBeCalledTimes(2)
      expect(modelOptions.setAdapter).toBeCalledTimes(1)
      expect(modelOptions.getAdapter).toHaveBeenNthCalledWith(1, 'ALL', 0, ['ALL','RES'])
      expect(modelOptions.getAdapter).toHaveBeenNthCalledWith(2, 'RES', 1, ['ALL','RES'])
      expect(modelOptions.setAdapter).toHaveBeenNthCalledWith(1, { data: 1 })
    })
  })
  it('sanitizes input data', () => {
    expect.assertions(2)
    return TestModel.find({ data: 1 }).then(() => {
      expect(sanitizeSchemaData).toBeCalledTimes(1)
      expect(sanitizeSchemaData).toBeCalledWith({ data: 1 }, modelOptions.schema)
    })
  })
  it('unescapes return value', () => {
    deepUnescape.mockReturnValueOnce(['UNESC'])
    expect.assertions(2)
    return TestModel.find({ data: 1 }).then((ret) => {
      expect(deepUnescape).toBeCalledTimes(1)
      expect(ret).toEqual(['UNESC'])
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
  it('rejects on non-string partial match', () => {
    expect.assertions(1)
    return TestModel.find({ data: 1 }, true).catch((err) => {
      expect(err).toEqual(errors.badPartial('number (data)'))
    })
  })
})


describe('Model count', () => {
  const TestModel = new Model('test', modelOptions)

  it('uses expected SQL', () => {
    expect.assertions(2)
    return TestModel.count('inp','key').then(() => {
      expect(services.get).toBeCalledTimes(1)
      expect(services.get).toBeCalledWith(
        'DB',
        expect.stringMatching(/SELECT COUNT\([^)]+\) \w+ FROM test WHERE key = \?/),
        ['inp']
      )
    })
  })
  it('gets all when no ID', () => {
    expect.assertions(2)
    return TestModel.count().then(() => {
      expect(services.get).toBeCalledTimes(1)
      expect(services.get).toBeCalledWith(
        'DB', expect.stringMatching(/SELECT COUNT\([^)]+\) \w+ FROM test/), []
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
  it('returns count on success', () => {
    expect.assertions(1)
    return TestModel.count().then((ret) => {
      expect(ret).toBe(15)
    })
  })
})


describe('Model add', () => {
  const TestModel = new Model('test', modelOptions)

  it('uses expected SQL', () => {
    expect.assertions(2)
    return TestModel.add({ data: 1, test: 2 }).then(() => {
      expect(services.getLastId).toBeCalledTimes(1)
      expect(services.getLastId).toBeCalledWith(
        'DB', 'INSERT INTO test(data,test) VALUES(?,?)', [1,2]
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
      expect(modelOptions.setAdapter).toBeCalledTimes(1)
      expect(modelOptions.setAdapter).toHaveBeenNthCalledWith(1, { data: 1 })
    })
  })
  it('sanitizes input data', () => {
    expect.assertions(2)
    return TestModel.add({ data: 1 }).then(() => {
      expect(sanitizeSchemaData).toBeCalledTimes(1)
      expect(sanitizeSchemaData).toBeCalledWith({ data: 1 }, modelOptions.schema)
    })
  })
  it('unescapes return value', () => {
    expect.assertions(1)
    return TestModel.add({ data: 1 }).then(() => {
      expect(deepUnescape).toBeCalledTimes(1)
    })
  })
  it('rejects on no data & no defaults', () => {
    const NoDefModel = new Model('noDef', { ...modelOptions, defaults: null })
    expect.assertions(1)
    return NoDefModel.add({}).catch((err) => {
      expect(err).toEqual(errors.noData())
    })
  })
})


describe('Model update', () => {
  // NOTE: Requires service.get() in Model.count() to return truthy (See mock below)
  const TestModel = new Model('test', modelOptions)

  it('uses expected SQL', () => {
    expect.assertions(2)
    return TestModel.update('inp', { data: 1, test: 2 }, 'key').then(() => {
      expect(services.run).toBeCalledTimes(1)
      expect(services.run).toBeCalledWith(
        'DB', 'UPDATE test SET data = ?, test = ? WHERE key = ?', [1, 2, 'inp']
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
  it('expected return on success', () => {
    expect.assertions(1)
    return TestModel.update('inp', { data: 1 }, 'key').then((ret) => {
      expect(ret).toEqual({ success: true })
    })
  })
  it('uses setAdapter on data', () => {
    expect.assertions(2)
    return TestModel.update('inp', { data: 1 }, 'key').then(() => {
      expect(modelOptions.setAdapter).toBeCalledTimes(1)
      expect(modelOptions.setAdapter).toHaveBeenNthCalledWith(1, { data: 1 })
    })
  })
  it('sanitizes input data', () => {
    expect.assertions(2)
    return TestModel.update('inp', { data: 1 }, 'key').then(() => {
      expect(sanitizeSchemaData).toBeCalledTimes(1)
      expect(sanitizeSchemaData).toBeCalledWith({ data: 1 }, modelOptions.schema)
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
  const TestModel = new Model('test', modelOptions)

  it('uses expected SQL', () => {
    expect.assertions(2)
    return TestModel.remove('inp','key').then(() => {
      expect(services.run).toBeCalledTimes(1)
      expect(services.run).toBeCalledWith(
        'DB', 'DELETE FROM test WHERE key = ?', ['inp']
      )
    })
  })
  it('uses defaults on missing <input>', () => {
    expect.assertions(1)
    return TestModel.remove('inp').then(() => {
      expect(services.run).toBeCalledWith(
        expect.anything(), expect.stringContaining('WHERE defId = ?'), expect.anything()
      )
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
  const TestModel = new Model('test', modelOptions)

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
      expect(modelOptions.getAdapter).toBeCalledTimes(2)
      expect(modelOptions.getAdapter).toHaveBeenNthCalledWith(1, 'ALL', 0, ['ALL','RES'])
      expect(modelOptions.getAdapter).toHaveBeenNthCalledWith(2, 'RES', 1, ['ALL','RES'])
    })
  })
  it('skips getAdapter when raw = true', () => {
    expect.assertions(1)
    return TestModel.custom('SQL','PARAMS',true).then(() => {
      expect(modelOptions.getAdapter).toBeCalledTimes(0)
    })
  })
  it('unescapes return value', () => {
    deepUnescape.mockReturnValueOnce(['UNESC'])
    expect.assertions(2)
    return TestModel.custom('SQL','PARAMS',false).then((ret) => {
      expect(deepUnescape).toBeCalledTimes(1)
      expect(ret).toEqual(['UNESC'])
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
  const TestModel = new Model('test', modelOptions)
  
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
        expect.anything(), expect.stringContaining('LIMIT 4 OFFSET 8')
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

jest.mock('../../config/db', () => ({
  getDb: jest.fn(() => 'DB'), openDb: jest.fn().mockResolvedValue(true)
}))

jest.mock('../../utils/validate.utils', () => ({ deepUnescape: jest.fn((val) => val) }))

jest.mock('../../utils/common.utils', () => ({
  hasDupes: jest.fn(() => false),
  caseInsensitiveObject: jest.fn((o) => o),
  capitalizeHyphenated: jest.fn()
}))

jest.mock('../../../config/models.cfg', () => ({
  defaults: { test: 'CFGDEFS' }, limits: { test: 'CFGLIMS' }
}))

jest.mock('../../services/db.services', () => ({
  run:       jest.fn((db) => db ? Promise.resolve() : Promise.reject('No DB')),
  get:       jest.fn((db) => db ? Promise.resolve({ val: 'GET', c: 15 }) : Promise.reject('No DB')),
  all:       jest.fn((db) => db ? Promise.resolve(['ALL','RES']) : Promise.reject('No DB')),
  getLastId: jest.fn((db) => db ? Promise.resolve('LAST_ID') : Promise.reject('No DB')),
  reset:     jest.fn((db) => db ? Promise.resolve() : Promise.reject('No DB')),
}))

jest.mock('../../utils/db.utils', () => ({
  sanitizeSchemaData: jest.fn((schema) => schema),
  schemaFromConfig: jest.fn(() => ({ config: 'SCHEMA' })),
  appendAndSort: jest.fn((list) => list),
}))