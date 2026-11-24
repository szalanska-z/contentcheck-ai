import { and, count, desc, eq, sql } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import type { z } from 'zod'
import type { createAnalysisInput, listAnalysesInput } from '../../shared/schemas/analysis'
import { analyzeHtml } from '../../shared/utils/analyzeHtml'
import { analyses } from '../db/schema'

const summary = {
  id: analyses.id,
  title: analyses.title,
  createdAt: analyses.createdAt,
  aiStatus: analyses.aiStatus,
  issueCount: sql<number>`jsonb_array_length(${analyses.issues})`.mapWith(Number),
}
const newestFirst = [desc(analyses.createdAt), desc(analyses.id)]

export function analysisService(db: PgDatabase<PgQueryResultHKT>, userId: string) {
  const owned = eq(analyses.userId, userId)
  const byId = (id: string) => and(owned, eq(analyses.id, id))

  return {
    async list({ q, page, limit }: z.infer<typeof listAnalysesInput>) {
      const where = q
        ? and(owned, sql`strpos(lower(${analyses.title}), lower(${q})) > 0`)
        : owned
      const [items, [counts]] = await Promise.all([
        db.select(summary).from(analyses).where(where).orderBy(...newestFirst).limit(limit).offset((page - 1) * limit),
        db.select({ total: count() }).from(analyses).where(where),
      ])
      return { items, total: counts!.total, page, limit }
    },

    async dashboard() {
      const [recent, [totals]] = await Promise.all([
        db.select(summary).from(analyses).where(owned).orderBy(...newestFirst).limit(5),
        db.select({
          total: count(),
          issueCount: sql<number>`coalesce(sum(jsonb_array_length(${analyses.issues})), 0)`.mapWith(Number),
          withSuggestions: sql<number>`count(*) filter (where case when jsonb_typeof(${analyses.aiSuggestions}) = 'array' then jsonb_array_length(${analyses.aiSuggestions}) > 0 else false end)`.mapWith(Number),
        }).from(analyses).where(owned),
      ])
      return { recent, ...totals! }
    },

    async get(id: string) {
      const [report] = await db.select().from(analyses).where(byId(id)).limit(1)
      if (!report) return
      const { userId: _owner, aiClaimId: _claimId, aiClaimUntil: _claimUntil, ...snapshot } = report
      return snapshot
    },

    async create(input: z.infer<typeof createAnalysisInput>) {
      const values = { ...input, userId, issues: analyzeHtml(input.originalHtml) }
      if (!input.sourceAnalysisId) {
        const [report] = await db.insert(analyses).values(values).returning({ id: analyses.id })
        return report!
      }
      const sourceId = input.sourceAnalysisId
      return db.transaction(async (tx) => {
        const [source] = await tx.select({ id: analyses.id }).from(analyses).where(byId(sourceId)).for('key share')
        if (!source) return
        const [report] = await tx.insert(analyses).values(values).returning({ id: analyses.id })
        return report!
      })
    },

    async rename(id: string, title: string) {
      const [report] = await db.update(analyses).set({ title, updatedAt: new Date() })
        .where(byId(id)).returning({ id: analyses.id })
      return report
    },

    async remove(id: string) {
      const [report] = await db.delete(analyses).where(byId(id)).returning({ id: analyses.id })
      return report
    },
  }
}
