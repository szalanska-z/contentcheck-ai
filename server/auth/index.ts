import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { getDatabase } from '../db/client'
import * as schema from '../db/auth-schema'
import { createAuthEmail, getEmailSettings } from './email'
import { authOptions } from './options'

function createAuth() {
  const { DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL } = process.env
  const production = !import.meta.dev

  if (!DATABASE_URL || !BETTER_AUTH_SECRET || BETTER_AUTH_SECRET.length < 32 || !BETTER_AUTH_URL) {
    throw createError({ statusCode: 503, statusMessage: 'Authentication unavailable' })
  }

  let baseURL: URL
  try {
    baseURL = new URL(BETTER_AUTH_URL)
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Authentication unavailable' })
  }

  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(baseURL.hostname)
  if (baseURL.origin !== BETTER_AUTH_URL.replace(/\/$/, '')
    || (production ? baseURL.protocol !== 'https:' : !loopback || baseURL.protocol !== 'http:')) {
    throw createError({ statusCode: 503, statusMessage: 'Authentication unavailable' })
  }

  const db = getDatabase()
  const settings = production ? getEmailSettings() : undefined
  const sendEmail = settings ? createAuthEmail(settings) : undefined
  return betterAuth({
    ...authOptions(production, sendEmail),
    baseURL: baseURL.origin,
    secret: BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: 'pg', schema, transaction: true }),
  })
}

let auth: ReturnType<typeof createAuth> | undefined

export function getAuth() {
  return auth ??= createAuth()
}
