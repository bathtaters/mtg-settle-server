import { Definition } from '../../engine/models/Model.d'
import { setCode, cardID, date } from '../models/schema.shared'
import { cardsPerGame } from './game.cfg'

export const
  managerActions = ["Update All", "Add", "Remove", "Create", "Up To", "Edit", "Delete", "Clean"] as const,
  gameActions = ["Replace With:", "Random", "Preview", "Swap With:", "Cards", "Game", "Choose Set", "Lock", "Unlock", "Delete"] as const,
  cleanupOptions = ["setCards", "cardImages", "games"] as const


const cardIndex: Definition = { typeStr: 'int?', limits: { min: 0, max: cardsPerGame - 1 } }
export const
  managerForm: { [key: string]: Definition } = {
    addSet:    { ...setCode },
    removeSet: { ...setCode },
    game:      { ...date },
    newGame:   { ...date },
    cleanup:   { typeStr: 'string[]', limits: { max: cleanupOptions.length } },
  },
  gameForm: { [key: string]: Definition } = {
    date:      { ...date },
    newCard:   { ...cardID },
    newSet:    { ...setCode },
    position:  { ...cardIndex },
    swapA:     { ...cardIndex },
    swapB:     { ...cardIndex },
  }

  
export type ManagerAction = typeof managerActions[number]
export type GameAction = typeof gameActions[number]
export type CleanupOption = typeof cleanupOptions[number]