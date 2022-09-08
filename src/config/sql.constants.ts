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

export const multiUpdate = <Schema extends { [key: string]: any }>(
  table: string, idKey: Extract<keyof Schema, string>, updates: Partial<Schema>[], updateFields?: Extract<keyof Schema, string>[]
): [string, { [param: string]: any }] | undefined => {

  const columns = updateFields || Object.keys(updates[0]).filter((k) => k !== idKey) as Extract<keyof Schema, string>[]
  if (!columns.length) return
  
  updates = updates.filter((update) => columns.every((col) => col in update))
  if (!updates.length) return
  
  return [
    `UPDATE ${table} SET ${columns.map((col) =>
      `${col} = CASE ${idKey}\n\t${
        updates.map((_,i) => `WHEN $${idKey}${i} THEN $${col}${i}`).join('\n\t')
      }\n    END`
    ).join(', ')} WHERE ${idKey} IN (${
      updates.map((_,i) => `$${idKey}${i}`).join(',')
    })`,
    updates.reduce((params: {[key:string]: any}, card, i) => {
      params['$'+idKey+i] = card[idKey]
      columns.forEach((col) => params['$'+col+i] = card[col])
      return params
    }, {})
  ]
}