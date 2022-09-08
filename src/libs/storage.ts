import ImageKit from "imagekit"
import { UrlOptions, Transformation } from "imagekit/dist/libs/interfaces"
import { delayRequest } from '../utils/fetch.utils'
// @ts-ignore // resolveJsonModule is true in tsconfig
import { ikOptions } from '../config/credentials.json'
import logger from "../../engine/libs/log"

const imagekit = new ImageKit(ikOptions.connection)

export async function storeImage(imageURL: string): Promise<ImageDetail> {
  await delayRequest(ikOptions.minRequestInterval, 'scryfall')
  const res = await imagekit.upload({ file: imageURL, ...ikOptions.upload })
  return { img: res.fileId, url: res.filePath }
}

export async function deleteImage(fileId: string): Promise<void> {
  await imagekit.deleteFile(fileId).catch((err) => logger.error(`ImageKit Delete ERROR: <${fileId}> ${err.message}`))
}

export function pathToUrl(path: string, publicLink: boolean = true, resize?: Transformation) {
  let options = { path } as UrlOptions
  if (publicLink && ikOptions.publicEndpoint) options.urlEndpoint = ikOptions.publicEndpoint
  if (resize) options.transformation = [resize]
  return imagekit.url(options)
}

export declare type ImageDetail = { img: string, url: string }