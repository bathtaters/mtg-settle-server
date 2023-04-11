import ImageKit from "imagekit"
import { fetchRedirectURL } from "./fetch"
import { UrlOptions, Transformation } from "imagekit/dist/libs/interfaces"
import { delayRequest } from '../utils/fetch.utils'
// @ts-ignore // resolveJsonModule is true in tsconfig
import { ikOptions } from '../config/credentials.json'
import * as errors from "../config/errors"
import logger from "../../engine/libs/log"

const imagekit = new ImageKit(ikOptions.connection)

export async function storeImage(imageURL: string): Promise<ImageDetail> {
  await delayRequest(ikOptions.minRequestInterval, 'scryfall')
  
  const url = await fetchRedirectURL(imageURL)
  const res = await imagekit.upload({ file: url || imageURL, ...ikOptions.upload }).catch((err) => {
    if (err instanceof Error && err.message) throw err
    throw errors.storageError(err)
  })
  return { img: res.fileId, url: res.filePath }
}

export async function deleteImage(fileIds: string | string[]): Promise<void> {
  try {
    if (Array.isArray(fileIds)) await imagekit.bulkDeleteFiles(fileIds)
    else await imagekit.deleteFile(fileIds)
  } catch (err) {
    // @ts-ignore
    logger.error(`ImageKit Delete ERROR: <${Array.isArray(fileIds) ? 'BULK' : fileIds}> ${err?.message}`)
  }
}

export function pathToUrl(path: string, publicLink: boolean = true, resize?: Transformation) {
  let options = { path } as UrlOptions
  if (publicLink && ikOptions.publicEndpoint) options.urlEndpoint = ikOptions.publicEndpoint
  if (resize) options.transformation = [resize]
  return imagekit.url(options)
}

export function listIds() {
  return imagekit.listFiles(ikOptions.upload.folder ? { path: `/${ikOptions.upload.folder}/` } : {})
    .then((files) => files.map(({ fileId }) => fileId))
}

export declare type ImageDetail = { img: string, url: string }