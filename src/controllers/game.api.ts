import { GuiHandler } from './express'
import { isIsoDate } from '../libs/date'
import { getGameData } from '../services/game.services'
import { getSecret } from '../utils/encrypt.utils'
import { today, untilTomorrow } from '../libs/date'


export const getGame: GuiHandler<{ date?: string }> = async (req, res, next) => {
  try {
    const date = req.params.date && isIsoDate(req.params.date) ? req.params.date : today()
    const secret = getSecret()
    const game = await getGameData(date, secret)

    return res.send({
      game, secret,
      expiresIn: untilTomorrow(),
    })
  } catch (err) { return next(err) }
}
