const { downloadImage, renameImage, deleteImage } = require('../libs/storage')
const { getSetList, getSetCards, getSetImage, getCardImage } = require('../libs/fetch')
const { getImageURI } = require('../config/fetch.cfg')

const storeCardImage = (cardData, filename) => downloadImage(getImageURI(cardData), filename)

async function updateCardImage(data, old = null) {
  if (!old) {
    if (!data.scryfallId) delete data.img
    if (!data.img) return
    return storeCardImage(data, data.img)
  }

  if (!('img' in data) || data.img === old.img) return
  if (data.img && old.img) return renameImage(old.img, data.img)
  else if (!data.img) return deleteImage(old.img)
  else if (!old.img)  return storeCardImage(old, data.img)
}

async function updateGameSet(data, old = null) {
  if (!data.art && data.code && (!old || data.code !== old.code))
    data.art = await getSetArt(data.code)
}

module.exports = {
  storeCardImage, renameImage, deleteImage,
  getSetList, getSetCards, getSetImage, getCardImage,
  updateCardImage, updateGameSet
}