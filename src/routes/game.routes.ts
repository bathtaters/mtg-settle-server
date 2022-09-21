import { Router } from 'express'
import Games from '../models/Games'
import { getGame } from '../controllers/game.api'
import dailyCache from '../middleware/cache.middleware'
import authenticate from '../../engine/middleware/cors.middleware'

const router = Router()

router.get('/today', authenticate(Games.title as any, 'read'), dailyCache, getGame)

export default router