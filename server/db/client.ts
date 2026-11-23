import { drizzle } from 'drizzle-orm/node-postgres'

function createDatabase(connectionString: string) {
  return drizzle({ connection: { connectionString, max: 3, connectionTimeoutMillis: 5000 } })
}

let database: ReturnType<typeof createDatabase> | undefined

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw createError({ statusCode: 503, statusMessage: 'Database unavailable' })
  return database ??= createDatabase(connectionString)
}
