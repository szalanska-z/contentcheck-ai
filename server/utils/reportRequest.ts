import type { H3Event } from 'h3'
import type { z } from 'zod'
import { reportId } from '../../shared/schemas/analysis'
import { getDatabase } from '../db/client'
import { analysisService } from '../services/analysisService'

export async function userReports(event: H3Event) {
  const { user } = await requireUserSession(event)
  return analysisService(getDatabase(), user.id)
}

export function validateReportInput<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input)
  if (!result.success) throw createError({ statusCode: 400, statusMessage: 'Invalid report input' })
  return result.data
}

export function validateReportId(event: H3Event) {
  return validateReportInput(reportId, getRouterParam(event, 'id'))
}

export function requireReport<T>(report: T | undefined) {
  if (report === undefined) throw createError({ statusCode: 404, statusMessage: 'Report not found' })
  return report
}

export function checkReportOrigin(event: H3Event) {
  const origin = getRequestHeader(event, 'origin')
  if (origin && origin !== process.env.BETTER_AUTH_URL?.replace(/\/$/, '')) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden origin' })
  }
}

export async function readReportJson(event: H3Event, maxBytes: number): Promise<unknown> {
  checkReportOrigin(event)
  if (getRequestHeader(event, 'content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    throw createError({ statusCode: 415, statusMessage: 'Expected application/json' })
  }
  const tooLarge = () => createError({ statusCode: 413, statusMessage: 'Report input too large' })
  if (Number(getRequestHeader(event, 'content-length')) > maxBytes) throw tooLarge()

  const reader = toWebRequest(event).body?.getReader()
  const decoder = new TextDecoder()
  let size = 0
  let payload = ''
  if (reader) {
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > maxBytes) {
          void reader.cancel().catch(() => {})
          throw tooLarge()
        }
        payload += decoder.decode(value, { stream: true })
      }
      payload += decoder.decode()
    } finally {
      reader.releaseLock()
    }
  }
  try {
    return JSON.parse(payload)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON' })
  }
}
