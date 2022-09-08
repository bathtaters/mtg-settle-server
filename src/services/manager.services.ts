import { CleanupType } from '../controllers/express'
import Sets from '../models/Sets'
import Cards from '../models/Cards'
import Games from '../models/Games'
import { deleteImage, listIds } from './fetch.services'
import { getRandomEntry } from '../utils/game.utils'
import { arrayDifferences } from '../utils/common.utils'
import { cardsPerGame, clearOlderThan } from '../config/game.cfg'
import { gui } from '../config/urls.cfg'

export const gameURL = (date: string) => `${gui.basic.prefix}${gui.manage.prefix}${gui.manage.game}/${date}`

export async function getGameCards(setCode: string) {
  const gameCards = await Cards.getRandomIds(cardsPerGame, setCode)
  await Cards.getImages(gameCards)
  return gameCards
}

export async function updateGameCard(date: string, idx: number, cardId: string) {
  await Games.cardsTable.batchUpdate({ fid: date, idx }, { val: cardId }, false, async (update, matching) => { 
    if (matching && matching[0]) await Promise.all([
      Cards.clearImages([matching[0].val]), Cards.getImages([update.val])
    ])
  })
}

export async function setGame(date: string, overwrite?: boolean, setCode?: string) {
  if (!setCode) {
    const setList = await Sets.find({ skip: false }, false)
    if (!setList || !setList.length) throw new Error('Must download sets before creating a game.')
    setCode = getRandomEntry(setList).code
  }

  await Cards.addSet(setCode, false)

  const cards = await getGameCards(setCode)
  await Games.add({ date, setCode, cards }, overwrite ? 'overwrite' : 'abort')
}


export async function deleteGame(date: string) {
  const cards = await Games.get(date, 'date').then((data) => data.cards)
  if (cards && cards.length) await Cards.clearImages(cards)
  await Games.remove(date, 'date')
}


export async function cleanDb(skip: CleanupType[] = []) {
  if (!skip.includes('games')) {
    await Games.removeOlder(new Date(new Date().getTime() - clearOlderThan).toJSON().slice(0,10))
  }
  
  if (!skip.includes('setCards')) {
    const gameSets = await Games.get().then((games) => games.map(({ setCode }) => setCode))
    await Cards.batchRemove(gameSets, 'setCode', true)
  }

  if (!skip.includes('cardImages')) {
    const gameCards = await Games.cardsTable.get().then((cards) => cards.map(({ val }) => val))
    await Cards.clearImages(gameCards, undefined, true)
    
    const cardLists = await Promise.all([Cards.listImageIds(), listIds()])
    const [imglessCards, cardlessImgs] = arrayDifferences<string>(...cardLists)
    if (cardlessImgs?.length) await deleteImage(cardlessImgs)
    if (imglessCards?.length) await Cards.getImages(imglessCards, 'img', false, true)
  }
}
