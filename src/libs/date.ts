import { formatISO, startOfTomorrow } from 'date-fns'

export const formatDate = (date: Date) => formatISO(date, { representation: 'date' })

export const today = () => formatDate(new Date())

export const tomorrow = startOfTomorrow

export const untilTomorrow = () => startOfTomorrow().getTime() - new Date().getTime()