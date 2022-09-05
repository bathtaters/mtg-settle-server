import { FormHandler, GameForm, ManagerForm } from './express'
import Sets from '../models/Sets'
import Cards from '../models/Cards'
import Games from '../models/Games'

import { gameURL, addGameCards, updateGameCard, setGame, deleteGame, cleanDb } from '../services/manager.services'
import { isIsoDate } from '../utils/game.utils'
import { gui } from '../config/urls.cfg'
import { cardsPerGame } from '../config/game.cfg'
import GameCards from '../models/GameCards'

export const homeForm: FormHandler<ManagerForm> = async (req, res, next) => {
  try {
    switch (req.body._action) {
      case 'Update All':
        await Sets.updateAll(true)
        break

      case 'Add':
        if (!req.body.addSet) throw new Error(`No set selected.`)
        await Cards.addSet(req.body.addSet, true)
        break

      case 'Remove':
        if (!req.body.removeSet) throw new Error(`No set selected.`)
        await Cards.remove(req.body.removeSet, 'setCode')
        break

      case 'Create':
        if (!req.body.newGame) throw new Error(`No date selected.`)
        if (!isIsoDate(req.body.newGame)) throw new Error(`Date is invalid format: ${req.body.newGame}`)
        await setGame(req.body.newGame, false)
        break

      case 'Edit':
        if (!req.body.game) throw new Error(`No game selected.`)
        if (!isIsoDate(req.body.game)) throw new Error(`Game date is invalid format: ${req.body.game}`)
        return res.redirect(gameURL(req.body.game))

      case 'Delete':
        if (!req.body.game) throw new Error(`No game selected.`)
        if (!isIsoDate(req.body.game)) throw new Error(`Game date is invalid format: ${req.body.game}`)
        await deleteGame(req.body.game)
        break

      case 'Clean':
        const cleanupSkips = !req.body.cleanup ? [] : !Array.isArray(req.body.cleanup) ? [req.body.cleanup] : req.body.cleanup
        await cleanDb(cleanupSkips)
        break
      
      default: throw new Error(`Invalid action: ${req.body._action}`)
    }
    return next()
  } catch (err) { return next(err) }
}


export const gameForm: FormHandler<GameForm> = async (req, res, next) => {
  try {
    switch(req.body._action) {
      case 'Replace With:':
        if (!req.body.position) throw new Error('No card selected to replace.')
        if (!req.body.newCard) throw new Error('No card selected to replace with.')
        await updateGameCard(req.body.date, +req.body.position, req.body.newCard)
        await new Promise((res) => setTimeout(res, 400)) // Wait for image to load
        break

      case 'Swap With:':
        if (!req.body.swapA || !req.body.swapB) throw new Error('Must select 2 cards to swap.')
        if (isNaN(+req.body.swapA) || isNaN(+req.body.swapB)) throw new Error(`Invalid card(s) selected for swap: ${req.body.swapA} <-> ${req.body.swapB}`)
        await GameCards.swapCards(req.body.date, +req.body.swapA, +req.body.swapB)
        break

      case 'Choose Set':
        if (!req.body.newSet) throw new Error('No set selected to swap to.')
        await setGame(req.body.date, true, req.body.newSet)
        await new Promise((res) => setTimeout(res, 400 * cardsPerGame)) // Wait for images to load
        break

      case 'Game':
        await setGame(req.body.date, true)
        await new Promise((res) => setTimeout(res, 400 * cardsPerGame)) // Wait for images to load
        break

      case 'Cards':
        const game = await Games.get(req.body.date, 'date')
        await addGameCards(game.date, game.setCode, 'overwrite')
        await new Promise((res) => setTimeout(res, 400 * cardsPerGame)) // Wait for images to load
        break

      case 'Delete':
        await deleteGame(req.body.date)
        return res.redirect(gui.basic.prefix + gui.manage.prefix)

      default: throw new Error(`Invalid action: ${req.body._action}`)
    }
    return next()
  } catch (err) { return next(err) }
}