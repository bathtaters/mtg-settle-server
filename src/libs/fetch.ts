import fetch from 'cross-fetch'
import objPath from 'object-path'
import { ApolloClient, HttpLink, InMemoryCache, QueryOptions } from "@apollo/client/core"
import logger from '../../engine/libs/log'
import { gqlOptions } from "../config/fetch.cfg"
import { toObject, GenericObject } from "../utils/common.utils"
import * as errors from '../config/errors'

const gqlClient = new ApolloClient({ link: new HttpLink({ ...gqlOptions, fetch }), cache: new InMemoryCache() })

export async function fetchData(url: string): Promise<string>
export async function fetchData(url: string, toType: "text", options?: RequestInit): Promise<string>
export async function fetchData(url: string, toType: "blob", options?: RequestInit): Promise<Blob>
export async function fetchData(url: string, toType: "buffer", options?: RequestInit): Promise<ArrayBuffer>
export async function fetchData(url: string, toType: "object", options?: RequestInit): Promise<GenericObject | null>
export async function fetchData(url: string, toType: "object"|"blob"|"text"|"buffer", options?: RequestInit): Promise<string | GenericObject | ArrayBuffer | Blob | null>
export async function fetchData(url: string, toType: "object"|"blob"|"text"|"buffer" = "text", options: RequestInit = {}): Promise<string | GenericObject | ArrayBuffer | Blob | null> {
  const data = await fetch(url, options)
  switch (toType) {
    case "blob":   return data.blob()
    case "buffer": return data.arrayBuffer()
    case "object": return data.text().then(toObject)
    default:       return data.text()
  }
}

export async function fetchRedirectURL(url: string, options: RequestInit = {}, expectedStatus = 302): Promise<string | null> {
  try {
    const response = await fetch(url, { redirect: 'manual', ...options })

    if (response.status < 300) {
      logger.verbose(`Redirect response for ${url}: <${response.status}> instead of <${expectedStatus}>`)
      return url
    }
    if (response.status === expectedStatus) return response.headers.get('location')

    const resTxt = await response.text()
    logger.error(`Redirect response for ${url}: <${response.status}> ${resTxt}`)
    return null

  } catch (error: any) {
    throw errors.gatewayError(`Failed to fetch redirected URL: ${error.message}`);
  }
}

export async function queryDB(queryOptions: QueryOptions): Promise<any[]>
export async function queryDB<Type>(queryOptions: QueryOptions, dataPath: string, normalizeCb: Normalizer<Type>): Promise<Type[]>
export async function queryDB<Type>(queryOptions: QueryOptions, dataPath: string = '', normalizeCb?: Normalizer<Type>): Promise<Type[] | any[]> {
  let result = [] as any[], next
  while(next = await gqlClient.query(queryOptions)) {
    if (next.errors && next.errors.length) throw errors.apolloErr(next.errors)

    next = next && next.data && objPath.get(next.data, dataPath)
    if (next == null) throw errors.apolloNull(dataPath)
    if (normalizeCb) next = filterQuery(next, normalizeCb)
    if (!Array.isArray(next)) throw errors.apolloBad(next, dataPath)
    if (!next.length) break
    result = result.concat(next)

    if (!queryOptions.variables || !('take' in queryOptions.variables)) break
    queryOptions.variables.skip = queryOptions.variables.take + (queryOptions.variables.skip || 0)
  }
  return result
}

export declare type Normalizer<Type> = (data: any) =>  Type | null
export function filterQuery<Type>(data: any[], normalizeCb: Normalizer<Type>): Type[] {
  if (!Array.isArray(data)) return []
  
  let normalized = [] as Type[]
  data.forEach((entry: any) => {
    entry = normalizeCb(entry)
    if (entry) normalized.push(entry)
  })
  return normalized
}