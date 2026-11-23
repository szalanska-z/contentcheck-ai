import { randomUUID } from 'node:crypto'
import { and, eq, lt, sql } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import type { SuggestionResult } from '../../shared/types/analysis'
import { extractTextSegments } from '../../shared/utils/extractTextSegments'
import { aiDailyUsage, analyses } from '../db/schema'
import { SuggestionGenerationError, type SuggestionProvider } from './aiProvider'

export const dailySuggestionLimit = 5
const claimDurationMs = 2 * 60 * 1000

export async function generateSuggestions(db: PgDatabase<PgQueryResultHKT>, userId: string, id: string, provider?: SuggestionProvider) {
  const ownedReport = and(eq(analyses.id, id), eq(analyses.userId, userId))
  const claim = await db.transaction(async (tx) => {
    const [report] = await tx.select({
      originalHtml: analyses.originalHtml,
      aiSuggestions: analyses.aiSuggestions,
      aiMode: analyses.aiMode,
      aiModel: analyses.aiModel,
      aiStatus: analyses.aiStatus,
      claimUntil: analyses.aiClaimUntil,
    }).from(analyses).where(ownedReport).for('update')

    if (!report) return { kind: 'missing' } as const
    if (report.aiStatus === 'success' && report.aiSuggestions && report.aiMode) {
      const result = { aiSuggestions: report.aiSuggestions, aiMode: report.aiMode, aiModel: report.aiModel }
      return { kind: 'saved', result } as const
    }

    const now = new Date()
    if (report.claimUntil && report.claimUntil > now) return { kind: 'in-progress' } as const
    if (!provider) return { kind: 'configuration' } as const

    const day = now.toISOString().slice(0, 10)
    const [usage] = await tx.insert(aiDailyUsage).values({ userId, day, attempts: 1 }).onConflictDoUpdate({
      target: [aiDailyUsage.userId, aiDailyUsage.day],
      set: { attempts: sql`${aiDailyUsage.attempts} + 1` },
      setWhere: lt(aiDailyUsage.attempts, dailySuggestionLimit),
    }).returning({ attempts: aiDailyUsage.attempts })
    if (!usage) return { kind: 'limit' } as const

    const claimId = randomUUID()
    await tx.update(analyses).set({
      aiStatus: 'pending',
      aiClaimId: claimId,
      aiClaimUntil: new Date(now.getTime() + claimDurationMs),
    }).where(ownedReport)
    return { kind: 'claimed', claimId, originalHtml: report.originalHtml, provider } as const
  })

  if (claim.kind !== 'claimed') return claim
  const currentClaim = and(ownedReport, eq(analyses.aiClaimId, claim.claimId))
  let result: SuggestionResult
  try {
    const { suggestions, model } = await claim.provider.generate(extractTextSegments(claim.originalHtml))
    result = { aiSuggestions: suggestions, aiMode: claim.provider.mode, aiModel: model }
  } catch (error) {
    await db.update(analyses).set({ aiStatus: 'error', aiClaimId: null, aiClaimUntil: null }).where(currentClaim)
    return { kind: error instanceof SuggestionGenerationError ? error.kind : 'provider-error' } as const
  }

  const [updated] = await db.update(analyses).set({
    ...result,
    aiStatus: 'success',
    aiClaimId: null,
    aiClaimUntil: null,
    updatedAt: new Date(),
  }).where(currentClaim).returning({ id: analyses.id })
  if (updated) return { kind: 'saved', result } as const
  const [exists] = await db.select({ id: analyses.id }).from(analyses).where(ownedReport)
  return { kind: exists ? 'in-progress' : 'missing' } as const
}
