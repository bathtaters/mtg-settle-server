import { Game } from '../models/_types'
import Games from '../models/Games'
import Sets from '../models/Sets'
import Cards from '../models/Cards'
import { combineGame } from '../utils/game.utils'
import { encryptData } from '../utils/encrypt.utils'
import * as errors from '../config/errors'


export async function getGameData(date: string, secret?: string): Promise<string> {
  const game = await Games.get(date, 'date', false, true) as Omit<Game, 'cards'>
  if (!game) throw errors.noEntry(date)

  const solution = combineGame(game, await Sets.get(game.setCode, 'code'), await Games.getCards(game.date, Cards))

  return secret ? encryptData(solution, secret) : JSON.stringify(solution)
}