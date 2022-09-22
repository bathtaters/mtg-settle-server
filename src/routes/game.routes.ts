import { Router } from 'express'
import Cached from '../models/Cached'
import Sets from '../models/Sets'
import { getGame, getSetList } from '../controllers/game.api'
import dailyCache from '../middleware/cache.middleware'
import authenticate from '../../engine/middleware/cors.middleware'

const router = Router()

router.get('/today',   authenticate(Cached.title as any, 'read'), dailyCache, getGame)
router.get('/setlist', authenticate(Sets.title   as any, 'read'), getSetList)

export default router