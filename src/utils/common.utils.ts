import { isRegEx } from '../../engine/utils/users.utils'

export declare type GenericObject = { [key: string]: any }

export interface TestRules<Type extends object> {
  test: "some"|"every",
  equals?: Partial<Type>,
  matches?: Partial<Type>,
  notEquals?: Partial<Type>,
}

export const sqlArray = (arr: any[]) => `(${arr.map(() => "?").join(",")})`

export function toObject(data: string): GenericObject | null {
  if (typeof data !== 'string') return null
  let parsed
  try { parsed = JSON.parse(data) }
  catch (err) { throw new Error(`Unable to parse string: ${data}`) }
  if (!parsed || typeof parsed !== 'object') return null
  return parsed as GenericObject
}



const checkMatch = (matcher: any, actual: any): boolean => {
  if (typeof matcher === 'string') return typeof actual === 'string' && actual.includes(matcher)
  if (isRegEx(matcher)) return typeof actual === 'string' && (matcher as RegExp).test(actual)
  if (!actual || !matcher || typeof matcher !== 'object' || typeof actual !== 'object') return actual == matcher
  if (!Array.isArray(matcher))
    return Object.keys(matcher).every((key: keyof any) => key in actual && checkMatch(matcher[key], actual[key]))
  let testArr = [...actual]
  return matcher.every((match: any) => testArr.some((entry: any, idx) => checkMatch(match,entry) && testArr.splice(idx, 1)))
}

export const testObject = <Type extends GenericObject>(object: Type, ...rules: TestRules<Type>[]): boolean => 
  rules.every(({ test = 'some', equals, matches, notEquals }) => {
    const bailOn = test === 'some'
    if (equals && Object.keys(equals)[bailOn ? 'some' : 'every']((key) =>
      object[key] === equals[key]) === bailOn
    ) return bailOn
    if (matches && Object.keys(matches)[bailOn ? 'some' : 'every']((key) =>
      checkMatch(matches[key], object[key])) === bailOn
    ) return bailOn
    if (notEquals && Object.keys(notEquals)[bailOn ? 'some' : 'every']((key) =>
      object[key] !== notEquals[key]) === bailOn
    ) return bailOn
    return !bailOn
  })