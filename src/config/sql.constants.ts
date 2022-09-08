import { arrayLabel } from '../../engine/config/models.cfg'
const { foreignId, index, entry } = arrayLabel

export const swapIndexs = (arrayTable: string) =>
  `UPDATE ${arrayTable} SET ${index} = ? WHERE ${foreignId} = ? AND ${index} = ?`

export const gameCardJoin = (gameArray: string, cardTable: string) => {
  return `SELECT ${cardTable}.*, ${gameArray}.${index} FROM ${gameArray}
    JOIN ${cardTable} ON ${cardTable}.id = ${gameArray}.${entry}
    WHERE ${gameArray}.${foreignId} = ?
    ORDER BY ${gameArray}.${foreignId}, ${gameArray}.${index} ASC`
}