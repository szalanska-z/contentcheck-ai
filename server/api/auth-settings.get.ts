import { getEmailSettings } from '../auth/email'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const emailEnabled = !import.meta.dev && Boolean(getEmailSettings())
  return { registrationAvailable: import.meta.dev || emailEnabled, emailEnabled }
})
