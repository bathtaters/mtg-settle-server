import { GuiHandler } from './express'
import { matchedData } from 'express-validator'
import Sets from '../models/Sets'
import Cards from '../models/Cards'
import Games from '../models/Games'

import { isIsoDate, addDay } from '../libs/date'
import { gameURL } from '../services/manager.services'
import { cardImageURI } from '../config/fetch.cfg'
import { hasAccess } from '../../engine/utils/users.utils'
import { managerActions, gameActions, managerForm, cleanupOptions } from '../config/forms.cfg'
import { access } from '../../engine/config/users.cfg'
import { gui } from '../config/urls.cfg'
import * as errors from '../config/errors'


export const homeController: GuiHandler = async (req, res, next) => {
  try {
    const setList = await Sets.get().then((sets) => sets.filter(({ skip }) => !skip).map(({ code }) => code))
    const gameList = await Games.get().then((games) => games.map(({ date }) => date).sort().reverse())
    const cardSets = await Cards.getSetList()
    
    const minDate = gameList?.length && addDay(gameList[0])
    
    return res.render('manage', {
      title: 'Management Console',
      user: req.user && req.user.username,
      isAdmin: req.user && hasAccess(req.user.access, access.admin),
      csrfToken: req.csrfToken && req.csrfToken(),
      setList,
      gameList,
      cardSets,
      cleanupOptions,
      minDate,
      schema: managerForm,
      actions: managerActions,
      baseURL: gui.basic.prefix + gui.manage.prefix,
    })
  } catch (err) { return next(err) }
}


export const gameController: GuiHandler<{ date?: string }> = async (req, res, next) => {
  try {
    const date: string = matchedData(req).date
    if (!date || !isIsoDate(date)) return next()

    const game = await Games.get(date, 'date')
    if (!game) throw errors.noEntry(date)

    const gameList = await Games.get().then((games) => games.map(({ date }) => date).sort())
    const gameIdx = gameList.findIndex((gameDate) => gameDate === date)

    const solution = await Sets.get(game.setCode, 'code')

    const cards = await Games.getCards(game.date, Cards)

    const allCards = await Cards.find({ setCode: game.setCode }, false, 'number')
    const allSets = await Sets.get().then((sets) => sets.filter(({ skip }) => !skip).map(({ code }) => code))

    return res.render('game', {
      title: 'Game Editor',
      user: req.user && req.user.username,
      isAdmin: req.user && hasAccess(req.user.access, access.admin),
      csrfToken: req.csrfToken && req.csrfToken(),
      game,
      next: gameList[gameIdx + 1],
      prev: gameList[gameIdx - 1],
      solution,
      cards,
      allCards,
      allSets,
      cardImageURI,
      actions: gameActions,
      baseURL: gui.basic.prefix + gui.manage.prefix,
      gameURL: gui.basic.prefix + gui.manage.prefix + gui.manage.game + '/',
    })
  } catch (err) { return next(err) }
}


export const redirectGame: GuiHandler<{ date?: string }> = (req,res,next) => {
  const date: string = matchedData(req).date
  return isIsoDate(date) ? res.redirect(gameURL(date)) : next()
}