import { GuiHandler } from './express'
import Sets from '../models/Sets'
import Cards from '../models/Cards'
import Games from '../models/Games'
import GameCards from '../models/GameCards'

import { isIsoDate } from '../utils/game.utils'
import { cardImageURI } from '../config/fetch.cfg'
import { hasAccess } from '../../engine/utils/users.utils'
import { access } from '../../engine/config/users.cfg'
import { gui } from '../config/urls.cfg'


export const homeController: GuiHandler = async (req, res, next) => {
  try {
    const setList = await Sets.get().then((sets) => sets.filter(({ skip }) => !skip).map(({ code }) => code))
    const gameList = await Games.get().then((games) => games.map(({ date }) => date))
    const cardSets = await Cards.getSetList()
    
    return res.render('manage', {
      title: 'Management Console',
      user: req.user && req.user.username,
      isAdmin: req.user && hasAccess(req.user.access, access.admin),
      csrfToken: req.csrfToken(),
      setList,
      gameList,
      cardSets,
      baseURL: gui.basic.prefix + gui.manage.prefix,
    })
  } catch (err) { return next(err) }
}


export const gameController: GuiHandler<{ date?: string }> = async (req, res, next) => {
  try {
    if (!req.params.date || !isIsoDate(req.params.date)) return next()

    const game = await Games.get(req.params.date, 'date')
    if (!game) throw new Error(`Game not yet generated for date: ${req.params.date}`)

    const solution = await Sets.get(game.setCode, 'code')

    const cards = await GameCards.getCards(game.date, Cards)

    const allCards = await Cards.find({ setCode: game.setCode }, false)
    const allSets = await Sets.get().then((sets) => sets.filter(({ skip }) => !skip).map(({ code }) => code))

    return res.render('game', {
      title: 'Game Editor',
      user: req.user && req.user.username,
      isAdmin: req.user && hasAccess(req.user.access, access.admin),
      csrfToken: req.csrfToken(),
      game,
      solution,
      cards,
      allCards,
      allSets,
      cardImageURI,
      baseURL: gui.basic.prefix + gui.manage.prefix,
    })
  } catch (err) { return next(err) }
}