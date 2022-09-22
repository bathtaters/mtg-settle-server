import { GuiHandler } from './express'
import { today, tomorrow } from '../libs/date'
import Sets from '../models/Sets'
import { getGameData } from '../services/game.services'
import { getSecret } from '../utils/encrypt.utils'
import { refetchSets } from '../config/game.cfg'


export const getGame: GuiHandler = async (req, res, next) => {
  try {
    const secret = getSecret()
    const data = await getGameData(today(), secret)

    return res.locals.sendCache({
      data, secret,
      expires: tomorrow(),
    })
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