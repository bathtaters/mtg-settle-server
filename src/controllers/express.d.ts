import express from 'express'
import { GameAction, ManagerAction } from '../config/forms.cfg'
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
  _action: ManagerAction,
  updateSet?: string,
  addSet?: string,
  removeSet?: string,
  newGame?: string,
  game?: string,
  cleanup?: CleanupType[]|CleanupType,
  _csrf?: string,
}

export interface GameForm {
  _action: GameAction,
  date: string,
  position?: number,
  newCard?: string,
  newSet?: string,
  swapA?: number,
  swapB?: number,
  _csrf?: string,
}

export declare type GuiHandler<Params extends object = {}> = express.RequestHandler<Params, any, {},   {}>
export declare type FormHandler<Body  extends object = {}> = express.RequestHandler<{},     any, Body, {}>
