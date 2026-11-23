import { randomBytes } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { expect, test } from 'vitest'
import { authOptions } from '../../server/auth/options'
import * as schema from '../../server/db/auth-schema'

test('registers, signs in and invalidates the session on sign-out', async () => {
  const client = new PGlite()
  try {
    const db = drizzle(client)
    await migrate(db, { migrationsFolder: './drizzle' })

    const baseURL = 'http://127.0.0.1:3000'
    const auth = betterAuth({
      ...authOptions(false),
      baseURL,
      secret: randomBytes(32).toString('hex'),
      database: drizzleAdapter(db, { provider: 'pg', schema, transaction: true }),
    })

    function post(path: string, body: object, cookie = '') {
      return auth.handler(new Request(`${baseURL}/api/auth/${path}`, {
        method: 'POST',
        headers: {
          origin: baseURL,
          'content-type': 'application/json',
          'x-contentcheck-client-ip': '127.0.0.1',
          cookie,
        },
        body: JSON.stringify(body),
      }))
    }

    const credentials = { email: 'editor@example.com', password: 'demo-password-2026' }
    const registration = await post('sign-up/email', { ...credentials, name: 'Ola' })
    expect(registration.status, await registration.clone().text()).toBe(200)

    const wrongPassword = await post('sign-in/email', { ...credentials, password: 'wrong-password' })
    expect(wrongPassword.status).toBe(401)

    const signIn = await post('sign-in/email', credentials)
    expect(signIn.status, await signIn.clone().text()).toBe(200)
    const sessionCookie = signIn.headers.getSetCookie()
      .find(value => value.startsWith('better-auth.session_token='))
    expect(sessionCookie).toContain('HttpOnly')
    const cookie = sessionCookie!.split(';')[0]!
    const headers = new Headers({ cookie })

    const session = await auth.api.getSession({ headers })
    expect(session?.user).toMatchObject({ name: 'Ola', email: credentials.email })

    const signOut = await post('sign-out', {}, cookie)
    expect(signOut.status).toBe(200)
    expect(await auth.api.getSession({ headers })).toBeNull()
  } finally {
    await client.close()
  }
})

test('blocks the sixth sign-in attempt from the same IP', async () => {
  const client = new PGlite()
  try {
    const db = drizzle(client)
    await migrate(db, { migrationsFolder: './drizzle' })

    const baseURL = 'http://127.0.0.1:3000'
    const auth = betterAuth({
      ...authOptions(false),
      baseURL,
      secret: randomBytes(32).toString('hex'),
      database: drizzleAdapter(db, { provider: 'pg', schema, transaction: true }),
    })

    function post(path: string, body: object, cookie = '') {
      return auth.handler(new Request(`${baseURL}/api/auth/${path}`, {
        method: 'POST',
        headers: {
          origin: baseURL,
          'content-type': 'application/json',
          'x-contentcheck-client-ip': '127.0.0.1',
          cookie,
        },
        body: JSON.stringify(body),
      }))
    }

    const credentials = { email: 'editor@example.com', password: 'demo-password-2026' }
    const registration = await post('sign-up/email', { ...credentials, name: 'Ola' })
    expect(registration.status, await registration.clone().text()).toBe(200)

    const wrongCredentials = { ...credentials, password: 'wrong-password' }
    for (let attempt = 1; attempt <= 5; attempt++) {
      const response = await post('sign-in/email', wrongCredentials)
      expect(response.status, 'Sign-in attempt ' + attempt).toBe(401)
    }

    const blockedResponse = await post('sign-in/email', wrongCredentials)
    expect(blockedResponse.status).toBe(429)
  } finally {
    await client.close()
  }
})
