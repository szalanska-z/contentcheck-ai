import { getAuth } from '../../auth'
import { emailTasks } from '../../auth/email'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const request = toWebRequest(event)
  if (import.meta.dev || !process.env.VERCEL) {
    // Overwrite the inbound value so a caller cannot choose its rate-limit key.
    request.headers.set('x-contentcheck-client-ip', getRequestIP(event) ?? '127.0.0.1')
  }

  return emailTasks.run(task => event.waitUntil(task), () => getAuth().handler(request))
})
