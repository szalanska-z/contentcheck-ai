import { AsyncLocalStorage } from 'node:async_hooks'

export const emailTasks = new AsyncLocalStorage<(task: Promise<unknown>) => void>()

export function getEmailSettings() {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.AUTH_EMAIL_FROM?.trim()
  if (process.env.AUTH_ENABLE_PUBLIC_SIGNUP !== 'true' || !apiKey || !from) return undefined
  return { apiKey, from }
}

export function createAuthEmail(settings: NonNullable<ReturnType<typeof getEmailSettings>>, send = fetch) {
  return async (to: string, subject: string, text: string) => {
    try {
      const response = await send('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: 'Bearer ' + settings.apiKey, 'content-type': 'application/json' },
        body: JSON.stringify({ from: settings.from, to: [to], subject, text }),
        signal: AbortSignal.timeout(5000),
      })
      if (!response.ok) throw new Error()
    } catch {
      // Better Auth can report this failure without tokens, addresses or the provider response.
      throw new Error('Authentication email delivery failed')
    }
  }
}
