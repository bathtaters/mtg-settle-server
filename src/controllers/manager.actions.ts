import { FormHandler, GameForm, ManagerForm } from './express'
import Sets from '../models/Sets'
import Cards from '../models/Cards'
import Games from '../models/Games'

import { gameURL, getGameCards, updateGameCard, setGame, deleteGame, cleanDb } from '../services/manager.services'
import { isIsoDate } from '../libs/date'
import { gui } from '../config/urls.cfg'
import * as errors from '../config/errors'

export const homeForm: FormHandler<ManagerForm> = async (req, res, next) => {
  try {
    switch (req.body._action) {
      case 'Update All':
        await Sets.updateAll(true)
        break

      case 'Add':
        if (!req.body.addSet) throw errors.noData('set')
        await Cards.addSet(req.body.addSet, true)
        break

      case 'Remove':
        if (!req.body.removeSet) throw errors.noData('set')
        await Cards.remove(req.body.removeSet, 'setCode')
        break

      case 'Create':
        if (!req.body.newGame) throw errors.noData('date')
        if (!isIsoDate(req.body.newGame)) throw errors.badData('game date',req.body.newGame,'date')
        await setGame(req.body.newGame, false)
        break

      case 'Edit':
        if (!req.body.game) throw errors.noData('game')
        if (!isIsoDate(req.body.game)) throw errors.badData('game date',req.body.game,'date')
        return res.redirect(gameURL(req.body.game))

      case 'Delete':
        if (!req.body.game) throw errors.noData('game')
        if (!isIsoDate(req.body.game)) throw errors.badData('game date',req.body.game,'date')
        await deleteGame(req.body.game)
        break

      case 'Clean':
        const cleanupSkips = !req.body.cleanup ? [] : !Array.isArray(req.body.cleanup) ? [req.body.cleanup] : req.body.cleanup
        await cleanDb(cleanupSkips)
        break
      
      default: throw errors.badAction(req.body._action)
    }
    return next()
  } catch (err) { return next(err) }
}


export const gameForm: FormHandler<GameForm> = async (req, res, next) => {
  try {
    switch(req.body._action) {
      case 'Replace With:':
        if (!req.body.position) throw errors.noData('target card')
        if (!req.body.newCard) throw errors.noData('replacement card')
        await updateGameCard(req.body.date, +req.body.position, req.body.newCard)
        break

      case 'Swap With:':
        if (!req.body.swapA || !req.body.swapB) throw errors.noData('card to swap')
        if (isNaN(+req.body.swapA) || isNaN(+req.body.swapB)) throw errors.badData('card to swap',`${req.body.swapA} or ${req.body.swapB}`,'number')
        await Games.swapCards(req.body.date, +req.body.swapA, +req.body.swapB)
        break

      case 'Choose Set':
        if (!req.body.newSet) throw errors.noData('set')
        await setGame(req.body.date, true, req.body.newSet)
        break

      case 'Game':
        await setGame(req.body.date, true)
        break

      case 'Cards':
        const game = await Games.get(req.body.date, 'date')
        if (!game) throw errors.noEntry(req.body.date)
        const cards = await getGameCards(game.setCode)
        await Games.update(game.date, { cards }, 'date')
        break

      case 'Delete':
        await deleteGame(req.body.date)
        return res.redirect(gui.basic.prefix + gui.manage.prefix)

      default: throw errors.badAction(req.body._action)
    }
    return next()
  } catch (err) { return next(err) }
}