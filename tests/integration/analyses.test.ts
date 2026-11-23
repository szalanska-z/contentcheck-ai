import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { expect, onTestFinished, test } from 'vitest'
import { listAnalysesInput } from '../../shared/schemas/analysis'
import { user } from '../../server/db/auth-schema'
import { analysisService } from '../../server/services/analysisService'

test('persists snapshots and scopes every report operation to its owner', async () => {
  const client = new PGlite()
  onTestFinished(() => client.close())
  const db = drizzle(client)
  await migrate(db, { migrationsFolder: './drizzle' })
  await db.insert(user).values([
    { id: 'owner', name: 'Owner', email: 'owner@example.test' },
    { id: 'other', name: 'Other', email: 'other@example.test' },
  ])
  const owner = analysisService(db, 'owner')
  const other = analysisService(db, 'other')
  const originalHtml = '<img src="cover.jpg">'
  const { id } = (await owner.create({ title: 'Guide 100%', originalHtml }))!
  const saved = await owner.get(id)
  expect(saved).toMatchObject({ originalHtml, issues: [{ ruleId: 'img-missing-alt' }] })

  expect(await other.get(id)).toBeUndefined()
  expect(await other.rename(id, 'Foreign title')).toBeUndefined()
  expect(await other.remove(id)).toBeUndefined()
  expect(await other.create({ title: 'Copy', originalHtml, sourceAnalysisId: id })).toBeUndefined()
  expect(await other.list(listAnalysesInput.parse({}))).toMatchObject({ total: 0, items: [] })
  expect(await other.dashboard()).toMatchObject({ total: 0, issueCount: 0, recent: [] })

  const copy = (await owner.create({ title: 'Revised guide', originalHtml: '<h2></h2>', sourceAnalysisId: id }))!
  expect(copy.id).not.toBe(id)
  expect(await owner.get(copy.id)).toMatchObject({ sourceAnalysisId: id, issues: [{ ruleId: 'heading-empty' }] })
  expect(await owner.list(listAnalysesInput.parse({ q: '%', limit: 1 })))
    .toMatchObject({ total: 1, items: [{ id, issueCount: 1 }] })
  const firstPage = await owner.list(listAnalysesInput.parse({ limit: 1 }))
  const nextPage = await owner.list(listAnalysesInput.parse({ limit: 1, page: 2 }))
  expect(firstPage.total).toBe(2)
  expect(new Set([firstPage.items[0]?.id, nextPage.items[0]?.id])).toEqual(new Set([id, copy.id]))
  expect(firstPage.items[0]).not.toHaveProperty('originalHtml')
  expect(await owner.dashboard()).toMatchObject({ total: 2, issueCount: 2, withSuggestions: 0 })

  expect(await owner.rename(id, 'Renamed')).toEqual({ id })
  expect(await owner.get(id)).toMatchObject({ title: 'Renamed', originalHtml, issues: saved?.issues })
  expect(await owner.remove(id)).toEqual({ id })
  expect(await owner.get(id)).toBeUndefined()
  expect(await owner.get(copy.id)).toMatchObject({ sourceAnalysisId: null })
})
