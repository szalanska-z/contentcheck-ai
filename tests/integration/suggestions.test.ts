import { PGlite } from '@electric-sql/pglite'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { expect, onTestFinished, test, vi } from 'vitest'
import { aiDailyUsage, user } from '../../server/db/schema'
import { analysisService } from '../../server/services/analysisService'
import { SuggestionGenerationError, type SuggestionProvider } from '../../server/services/aiProvider'
import { generateSuggestions } from '../../server/services/suggestionService'
import type { AiSuggestion } from '../../shared/schemas/ai'

test('persists suggestions, isolates owners, serializes concurrent generation and enforces the daily limit', async () => {
  const client = new PGlite()
  onTestFinished(() => client.close())
  const db = drizzle(client)
  await migrate(db, { migrationsFolder: './drizzle' })
  await db.insert(user).values([
    { id: 'a', name: 'Alice', email: 'alice@example.test' },
    { id: 'b', name: 'Bob', email: 'bob@example.test' },
  ])
  const reports = analysisService(db, 'a')
  const originalHtml = '<p>Some text.</p>'
  const create = async () => (await reports.create({ title: 'Example', originalHtml }))!.id
  const first = await create()

  const started = Promise.withResolvers<undefined>()
  const providerResponse = Promise.withResolvers<{ model: string, suggestions: AiSuggestion[] }>()
  const provider = {
    mode: 'live',
    generate: vi.fn(() => {
      started.resolve(undefined)
      return providerResponse.promise
    }),
  } satisfies SuggestionProvider

  expect(await generateSuggestions(db, 'b', first, provider)).toEqual({ kind: 'missing' })
  expect(await generateSuggestions(db, 'a', first)).toEqual({ kind: 'configuration' })
  const request = generateSuggestions(db, 'a', first, provider)
  await started.promise
  try {
    expect(await generateSuggestions(db, 'a', first, provider)).toEqual({ kind: 'in-progress' })
  } finally {
    providerResponse.resolve({
      model: 'mock-model',
      suggestions: [{ sourceId: 'segment-1', originalText: 'Some text.', suggestedText: 'Text.', reason: 'Shorter.' }],
    })
  }

  const stored = await request
  expect(stored).toMatchObject({ kind: 'saved', result: { aiMode: 'live', aiModel: 'mock-model' } })
  expect(await reports.get(first)).toMatchObject({ aiStatus: 'success', originalHtml, aiSuggestions: [{ suggestedText: 'Text.' }] })
  expect(await generateSuggestions(db, 'a', first)).toEqual(stored)
  expect(provider.generate).toHaveBeenCalledTimes(1)

  const failing: SuggestionProvider = {
    mode: 'live',
    async generate() { throw new SuggestionGenerationError('timeout') },
  }
  const retry = await create()
  expect(await generateSuggestions(db, 'a', retry, failing)).toEqual({ kind: 'timeout' })
  expect(await reports.get(retry)).toMatchObject({ aiStatus: 'error' })

  const empty: SuggestionProvider = { mode: 'demo', generate: vi.fn(async () => ({ model: null, suggestions: [] })) }
  const otherReports = await Promise.all([create(), create(), create()])
  const outcomes = await Promise.all([retry, ...otherReports].map(id => generateSuggestions(db, 'a', id, empty)))
  expect(outcomes.filter(result => result.kind === 'saved')).toHaveLength(3)
  expect(outcomes.filter(result => result.kind === 'limit')).toHaveLength(1)
  expect(empty.generate).toHaveBeenCalledTimes(3)
  const [usage] = await db.select().from(aiDailyUsage).where(eq(aiDailyUsage.userId, 'a'))
  expect(usage?.attempts).toBe(5)
  expect(await reports.dashboard()).toMatchObject({ withSuggestions: 1 })
})
