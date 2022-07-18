const { getEnvVars, stringifyEnv, filterOutProps, getChanged } = require('../../utils/settings.utils')

jest.mock('../../config/env.cfg', () => ({ defaults: { testA: 'TEST-1', testB: 'TEST-2' }}))

describe('getEnvVars', () => {
  it('gets vars from process.env', () => {
    expect(getEnvVars(['NODE_ENV'])).toEqual({ NODE_ENV: 'test' })
  })
  it('gets missing vars from env.cfg.defaults', () => {
    expect(getEnvVars(['testA'])).toEqual({ testA: 'TEST-1' })
    expect(getEnvVars(['testB'])).toEqual({ testB: 'TEST-2' })
    expect(getEnvVars(['testA','testB'])).toEqual({ testA: 'TEST-1', testB: 'TEST-2' })
  })
  it('returns undefined otherwise', () => {
    expect(getEnvVars(['test'])).toEqual({ test: undefined })
  })
})

describe('stringifyEnv', () => {
  it('returns string', () => {
    expect(typeof stringifyEnv({})).toBe('string')
  })
  it('converts object to .env text', () => {
    expect(stringifyEnv({ a: 1, b: "test" })).toBe('a=1\nb=test\n')
  })
})

describe('filterOutProps', () => {
  it('returns input object', () => {
    const obj = { a: 1, b: 2, c: 3 }
    expect(filterOutProps(obj, [])).toBe(obj)
    expect(filterOutProps(obj, [])).toEqual({ a: 1, b: 2, c: 3 })
  })
  it('removes listed props', () => {
    expect(filterOutProps({ a: 1, b: 2, c: 3, d: 4, TeSt: 'data' }, ['a', 'TeSt']))
      .toEqual({ b: 2, c: 3, d: 4 })
  })
  it('mutates input object', () => {
    const obj = { a: 1, b: 2, c: 3 }
    filterOutProps(obj, ['a', 'TeSt'])
    expect(obj).toEqual({ b: 2, c: 3 })
  })
})

describe('getChanged', () => {
  it('returns empty object when missing input', () => {
    expect(getChanged({ a: 1, b: '2', c: 'test' })).toEqual({})
    expect(getChanged(null,{ a: 1, b: '2', c: 'test' })).toEqual({})
  })
  it('returns empty object when equal inputs', () => {
    expect(getChanged({ a: 1, b: '2', c: 'test' },{ a: 1, b: '2', c: 'test' }))
      .toEqual({})
  })
  it('returns empty object when equal inputs', () => {
    expect(getChanged({ a: 1, b: '2', c: 'test' },{ a: 1, b: '2', c: 'test' }))
      .toEqual({})
  })
  it('returns base value of each changed values', () => {
    expect(getChanged({ a: 1, b: '2', c: 'test' },{ a: 5, b: '2', c: 'test2' }))
      .toEqual({ a: 1, c: 'test' })
  })
  it('ignore values not in update', () => {
    const result = getChanged({ a: 1, b: '2', c: 'test' },{ b: '2', c: 'test2' })
    expect(result).not.toHaveProperty('a')
    expect(result).toEqual({ c: 'test' })
  })
  it('returns undefined for values not in base', () => {
    const result = getChanged({ b: '2', c: 'test' },{ a: 1, b: '2', c: 'test2' })
    expect(result).toHaveProperty('a', undefined)
    expect(result).toEqual({ c: 'test' })
  })
})