import type { H3Event } from 'h3'
import { getAuth } from '../auth'

export async function requireUserSession(event: H3Event) {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const cookie = getRequestHeader(event, 'cookie')
  const session = cookie ? await getAuth().api.getSession({ headers: event.headers }) : null

  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return session
}
