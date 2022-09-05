import express from 'express'
import passport from 'passport'
import { CleanupType } from '../services/manager.services'

export declare type CleanupType = "setCards"|"cardImages"|"games"

declare global {
  namespace Express {
    interface User {
      username: string,
      access: number,
    }
  }
}

export interface ManagerForm {
  _action: "Update All"|"Add"|"Remove"|"Create"|"Edit"|"Delete"|"Clean",
  updateSet?: string,
  addSet?: string,
  removeSet?: string,
  newGame?: string,
  game?: string,
  cleanup?: CleanupType[]|CleanupType,
  _csrf?: string,
}

export interface GameForm {
  _action: "Replace With:"|"Swap With:"|"Cards"|"Game"|"Choose Set"|"Delete",
  date: string,
  position?: number|string,
  newCard?: string,
  newSet?: string,
  swapA?: number|string,
  swapB?: number|string,
  _csrf?: string,
}

export declare type GuiHandler<Params extends object = {}> = express.RequestHandler<Params, any, {},   {}>
export declare type FormHandler<Body  extends object = {}> = express.RequestHandler<{},     any, Body, {}>
