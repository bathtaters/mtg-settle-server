import { FormHandler, GameForm, ManagerForm } from './express'
import { matchedData } from 'express-validator'
import Sets from '../models/Sets'
import Cards from '../models/Cards'
import Games from '../models/Games'

import { gameURL, getGameCards, updateGameCard, setGame, deleteGame, cleanDb } from '../services/manager.services'
import { isIsoDate } from '../libs/date'
import { gui } from '../config/urls.cfg'
import * as errors from '../config/errors'

export const homeForm: FormHandler<ManagerForm> = async (req, res, next) => {
  try {
    const data = matchedData(req) as ManagerForm
    switch (data._action) {
      case 'Update All':
        await Sets.updateAll(true)
        break

      case 'Add':
        if (!data.addSet) throw errors.noData('set')
        await Cards.addSet(data.addSet, true)
        break

      case 'Remove':
        if (!data.removeSet) throw errors.noData('set')
        await Cards.remove(data.removeSet, 'setCode')
        break

      case 'Create':
        if (!data.newGame) throw errors.noData('date')
        if (!isIsoDate(data.newGame)) throw errors.badData('game date',data.newGame,'date')
        await setGame(data.newGame, false)
        break

      case 'Edit':
        if (!data.game) throw errors.noData('game')
        if (!isIsoDate(data.game)) throw errors.badData('game date',data.game,'date')
        return res.redirect(gameURL(data.game))

      case 'Delete':
        if (!data.game) throw errors.noData('game')
        if (!isIsoDate(data.game)) throw errors.badData('game date',data.game,'date')
        await deleteGame(data.game)
        break

      case 'Clean':
        await cleanDb(data.cleanup)
        break
      
      default: throw errors.badAction(data._action)
    }
    return next()
  } catch (err) { return next(err) }
}


export const gameForm: FormHandler<GameForm> = async (req, res, next) => {
  try {
    const data = matchedData(req, { includeOptionals: true }) as GameForm
    if (!data.date) throw errors.noData('date')
    switch(data._action) {
      case 'Replace With:':
        if (typeof data.position !== 'number') throw errors.noData('target card')
        if (!data.newCard) throw errors.noData('replacement card')
        await updateGameCard(data.date, data.position, data.newCard)
        break

      case 'Swap With:':
        if (typeof data.swapA !== 'number' || typeof data.swapB !== 'number')
          throw errors.badData('card to swap',`${data.swapA} or ${data.swapB}`,'number')
        await Games.swapCards(data.date, data.swapA, data.swapB)
        break

      case 'Choose Set':
        if (!data.newSet) throw errors.noData('set')
        await setGame(data.date, true, data.newSet)
        break

      case 'Game':
        await setGame(data.date, true)
        break

      case 'Cards':
        const game = await Games.get(data.date, 'date')
        if (!game) throw errors.noEntry(data.date)
        const cards = await getGameCards(game.setCode)
        await Games.update(game.date, { cards }, 'date')
        break

      case 'Delete':
        await deleteGame(data.date)
        return res.redirect(gui.basic.prefix + gui.manage.prefix)

      default: throw errors.badAction(data._action)
    }
    return next()
  } catch (err) { return next(err) }
}