import { GuiHandler } from './express'
import { today } from '../libs/date'
import Sets from '../models/Sets'
import { storeGameData } from '../services/game.services'
import { refetchSets } from '../config/game.cfg'


export const getGame: GuiHandler = async (req, res, next) => {
  try {
    const data = await storeGameData(today())
    return res.locals.sendCache(data)

  } catch (err) { return next(err) }
}


export const getSetList: GuiHandler = async (req, res, next) => {
  try {
    const data = await Sets.find({ skip: false }, false)
      .then((sets) => sets.map(({ code, name, block }) => ({ code, name, block })))
    return res.send({
      data, expiresIn: refetchSets
    })
  } catch (err) { return next(err) }
}