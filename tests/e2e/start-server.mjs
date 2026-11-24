import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { cp, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'

const root = fileURLToPath(new URL('../../', import.meta.url))
const require = createRequire(import.meta.url)
const nuxtBin = join(dirname(require.resolve('nuxt/package.json')), 'bin', 'nuxt.mjs')
const port = Number(process.env.CONTENTCHECK_E2E_PORT ?? 3210)
const previewRoot = resolve(root, '.tmp')
await mkdir(previewRoot, { recursive: true })
const workspace = await mkdtemp(join(previewRoot, 'e2e-'))
const db = new PGlite()
const server = new PGLiteSocketServer({ db, host: '127.0.0.1', port: 0, maxConnections: 3 })
let app
let cleanup

function shutdown() {
  return cleanup ??= (async () => {
    if (app?.exitCode === null && app.signalCode === null) {
      const exited = new Promise(resolveExit => app.once('exit', resolveExit))
      app.kill()
      await exited
    }
    await server.stop()
    await db.close()
    // mkdtemp creates a fresh child of our ignored workspace directory.
    if (workspace.startsWith(previewRoot + sep + 'e2e-')) await rm(workspace, { recursive: true, force: true })
  })()
}

const onSignal = () => { void shutdown().catch(() => { process.exitCode = 1 }) }
process.once('SIGINT', onSignal)
process.once('SIGTERM', onSignal)

try {
  await migrate(drizzle(db), { migrationsFolder: join(root, 'drizzle') })
  await server.start()
  await Promise.all(['app', 'shared', 'server', 'nuxt.config.ts', 'package.json', 'tsconfig.json'].map(name =>
    cp(join(root, name), join(workspace, name), { recursive: true }),
  ))
  const database = server.getServerConn()
  app = spawn(process.execPath, [nuxtBin, 'dev', '--no-fork', '--no-tui', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: workspace,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://postgres@' + database + '/postgres',
      BETTER_AUTH_SECRET: randomBytes(32).toString('hex'),
      BETTER_AUTH_URL: 'http://127.0.0.1:' + port,
      AUTH_ENABLE_PUBLIC_SIGNUP: 'false',
      RESEND_API_KEY: '',
      NUXT_AI_MODE: 'demo',
      NUXT_OPENAI_API_KEY: '',
      NUXT_OPENAI_MODEL: '',
      NUXT_AI_ALLOW_PRODUCTION_LIVE: 'false',
    },
  })
  const exitCode = await new Promise((resolveExit, reject) => {
    app.once('error', reject)
    app.once('exit', resolveExit)
  })
  process.exitCode = exitCode ?? 0
} finally {
  await shutdown()
}
