import { z } from 'zod'

export const htmlLimit = 10_000
export const titleLimit = 120
export const reportId = z.uuid()
const withoutNull = (value: string) => !value.includes('\u0000')
export const reportTitle = z.string().trim().min(1).max(titleLimit).refine(withoutNull)
export const originalHtml = z.string().max(htmlLimit).refine(value => Boolean(value.trim()) && withoutNull(value))
export const createAnalysisInput = z.strictObject({ title: reportTitle, originalHtml, sourceAnalysisId: reportId.optional() })
export const renameAnalysisInput = z.strictObject({ title: reportTitle })
export const listAnalysesInput = z.object({
  q: z.string().trim().max(titleLimit).refine(withoutNull).default(''),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})
