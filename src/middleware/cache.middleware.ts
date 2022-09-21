import express from 'express'
import Cached from '../models/Cached'
import { today } from '../libs/date'

const dailyCache: express.RequestHandler = async function(req, res, next) {
  try {
    const id = today()

    const data = await Cached.load(id)
    if (data) return res.send(data)
    
    res.locals.sendCache = (data: any) => 
      Cached.store(id, data)
        .then(() => res.send(data)).catch(next)

    next()

  } catch (err) { next(err) }
}


export default dailyCache