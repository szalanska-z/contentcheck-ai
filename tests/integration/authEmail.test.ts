import { randomBytes } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { expect, onTestFinished, test } from 'vitest'
import { authOptions } from '../../server/auth/options'
import { emailTasks } from '../../server/auth/email'
import * as schema from '../../server/db/auth-schema'

test('requires email verification and revokes sessions after a password reset', async () => {
  const client = new PGlite()
  onTestFinished(() => client.close())
  const db = drizzle(client)
  await migrate(db, { migrationsFolder: './drizzle' })
  const baseURL = 'https://contentcheck.example.test'

  const messages: string[] = []
  const secret = randomBytes(32).toString('hex')
  const credentials = { email: 'editor@example.test', password: 'initial-test-password' }
  const database = drizzleAdapter(db, { provider: 'pg', schema, transaction: true })
  const auth = betterAuth({
    ...authOptions(true, async (_recipient, _subject, text) => { messages.push(text) }),
    baseURL, secret, database,
  })
  const disabled = betterAuth({ ...authOptions(true), baseURL, secret, database })

  function postRequest(path: string, body: object) {
    return new Request(baseURL + '/api/auth/' + path, {
      method: 'POST',
      headers: { origin: baseURL, 'content-type': 'application/json', 'x-contentcheck-client-ip': '127.0.0.1' },
      body: JSON.stringify(body),
    })
  }

  async function post(path: string, body: object) {
    const tasks: Promise<unknown>[] = []
    const response = await emailTasks.run(task => tasks.push(task), () => auth.handler(postRequest(path, body)))
    await Promise.all(tasks)
    return response
  }

  const signup = { ...credentials, name: 'Editor', callbackURL: baseURL + '/login' }
  expect((await disabled.handler(postRequest('sign-up/email', signup))).status).toBe(400)
  expect((await post('sign-up/email', signup)).status).toBe(200)
  expect(messages).toHaveLength(1)
  expect((await post('sign-in/email', credentials)).status).toBe(403)

  const verificationLink = messages[0]!.split(' ').at(-1)!
  expect(new URL(verificationLink).origin).toBe(baseURL)
  const verification = await auth.handler(new Request(verificationLink))
  expect(verification.headers.get('location')).toBe(baseURL + '/login')

  const signIn = await post('sign-in/email', credentials)
  expect(signIn.status).toBe(200)
  const cookieHeader = signIn.headers.getSetCookie().find(value => value.includes('better-auth.session_token='))
  expect(cookieHeader).toContain('Secure')
  const headers = new Headers({ cookie: cookieHeader!.split(';')[0]! })
  expect((await auth.api.getSession({ headers }))?.user.emailVerified).toBe(true)

  const reset = await post('request-password-reset', { email: credentials.email, redirectTo: baseURL + '/reset-password' })
  expect(reset.status).toBe(200)
  const resetLink = messages.at(-1)!.split(' ').at(-1)!
  const redirect = await auth.handler(new Request(resetLink))
  const token = new URL(redirect.headers.get('location')!).searchParams.get('token')
  expect(token).toBeTruthy()
  const newPassword = 'replacement-test-password'
  expect((await post('reset-password', { token, newPassword })).status).toBe(200)
  expect(await auth.api.getSession({ headers })).toBeNull()
  expect((await post('sign-in/email', { ...credentials, password: newPassword })).status).toBe(200)
})
