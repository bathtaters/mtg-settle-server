import { Router } from 'express'
import Games from '../models/Games'
import { getGame } from '../controllers/game.api'
import authenticate from '../../engine/middleware/cors.middleware'

const router = Router()

router.get('/today', authenticate(Games.title as any, 'read'), getGame)

export default router