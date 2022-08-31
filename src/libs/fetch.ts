import fetch from 'cross-fetch'
import objPath from 'object-path'
import { ApolloClient, HttpLink, InMemoryCache, QueryOptions } from "@apollo/client/core"
import { gqlOptions } from "../config/fetch.cfg"
import { toObject, GenericObject } from "../utils/common.utils"

const gqlClient = new ApolloClient({ link: new HttpLink({ ...gqlOptions, fetch }), cache: new InMemoryCache() })

export async function fetchData(url: string): Promise<string>
export async function fetchData(url: string, toType: "text"): Promise<string>
export async function fetchData(url: string, toType: "blob"): Promise<Blob>
export async function fetchData(url: string, toType: "buffer"): Promise<ArrayBuffer>
export async function fetchData(url: string, toType: "object"): Promise<GenericObject | null>
export async function fetchData(url: string, toType: "object"|"blob"|"text"|"buffer"): Promise<string | GenericObject | ArrayBuffer | Blob | null>
export async function fetchData(url: string, toType: "object"|"blob"|"text"|"buffer" = "text"): Promise<string | GenericObject | ArrayBuffer | Blob | null> {
  const data = await fetch(url)
  switch (toType) {
    case "blob":   return data.blob()
    case "buffer": return data.arrayBuffer()
    case "object": return data.text().then(toObject)
    default:       return data.text()
  }
}

export async function queryDB(queryOptions: QueryOptions): Promise<any[]>
export async function queryDB<Type>(queryOptions: QueryOptions, normalizeCb: Normalizer<Type>, dataPath?: string): Promise<Type[]>
export async function queryDB<Type>(queryOptions: QueryOptions, normalizeCb?: Normalizer<Type>, dataPath: string = ''): Promise<Type[] | any[]> {
  const result = await gqlClient.query(queryOptions)
  if (result.errors && result.errors.length) throw new Error(`Apollo Query Error(s)[${result.errors.length}]: ${result.errors.map(String).join(', ')}`)
  if (normalizeCb) return filterQuery(objPath.get(result.data, dataPath), normalizeCb)
  if (Array.isArray(result.data)) return result.data
  return [] as any[]
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