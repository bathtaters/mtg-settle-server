import { GuiHandler } from './express'
import { getGameData } from '../services/game.services'
import { getSecret } from '../utils/encrypt.utils'
import { today, untilTomorrow } from '../libs/date'


export const getGame: GuiHandler<{ date?: string }> = async (req, res, next) => {
  try {
    const secret = getSecret()
    const game = await getGameData(today(), secret)

    return res.send({
      game, secret,
      expiresIn: untilTomorrow(),
    })
  } catch (err) { return next(err) }
}
