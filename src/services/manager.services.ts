import { CleanupType } from '../controllers/express'
import { IfExistsBehavior } from '../../engine/models/Model.d'
import Sets from '../models/Sets'
import Cards from '../models/Cards'
import Games from '../models/Games'
import GameCards from '../models/GameCards'
import { getRandomEntry } from '../utils/game.utils'
import { cardsPerGame } from '../config/game.cfg'
import { gui } from '../config/urls.cfg'

export const gameURL = (date: string) => `${gui.basic.prefix}${gui.manage.prefix}${gui.manage.game}/${date}`

export async function addGameCards(date: string, setCode: string, ifExists?: IfExistsBehavior) {
  const gameCards = await Cards.getRandomIds(cardsPerGame, setCode)
  await GameCards.batchAdd(gameCards.map((cardId, position) => ({ date, position, cardId })), ifExists)
}

export async function setGame(date: string, overwrite?: boolean, setCode?: string) {
  if (!setCode) {
    const setList = await Sets.find({ skip: false }, false)
    if (!setList || !setList.length) throw new Error('Must download sets before creating a game.')
    setCode = getRandomEntry(setList).code
  }

  await Games.add({ date, setCode }, overwrite ? 'overwrite' : 'abort')
  await Cards.addSet(setCode, false)

  await addGameCards(date, setCode, overwrite ? 'overwrite' : 'abort')
}


export async function deleteGame(date: string) {
  const game = await Games.get(date, 'date')
  if (!game) throw new Error(`Error deleting game ${date}: Game not found`)

  await GameCards.remove(game.date, 'date')
  await Games.remove(game.date, 'date')
}


export async function cleanDb(skip: CleanupType[] = []) {
  if (!skip.includes('games')) {
    const twoDaysAgo = new Date(new Date().getTime() - (2*24*60*60*1000)).toJSON().slice(0,10)
    await Games.removeOlder(twoDaysAgo)
    await GameCards.removeOlder(twoDaysAgo)
  }

  if (!skip.includes('setCards')) {
    const gameSets = await Games.get().then((games) => games.map(({ setCode }) => setCode))
    await Cards.batchRemove(gameSets, 'setCode', true)
  }

  if (!skip.includes('cardImages')) {
    const gameCards = await GameCards.get().then((cards) => cards.map(({ cardId }) => cardId))
    await Cards.clearImages(gameCards, 'id', true)
  }
}
