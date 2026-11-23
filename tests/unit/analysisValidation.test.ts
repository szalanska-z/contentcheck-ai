import { expect, it } from 'vitest'
import { createAnalysisInput, htmlLimit, reportId, reportTitle } from '../../shared/schemas/analysis'

it('rejects a title with only whitespace', () => {
  expect(reportTitle.safeParse('   ').success).toBe(false)
})

it('rejects HTML above the limit and preserves accepted input', () => {
  expect(createAnalysisInput.safeParse({ title: 'Report', originalHtml: 'a'.repeat(htmlLimit + 1) }).success).toBe(false)
  expect(createAnalysisInput.parse({ title: '  Report ', originalHtml: ' <p>Test</p> ' }))
    .toEqual({ title: 'Report', originalHtml: ' <p>Test</p> ' })
})

it('rejects invalid identifiers and browser-supplied findings', () => {
  expect(reportId.safeParse('not-an-id').success).toBe(false)
  expect(createAnalysisInput.safeParse({ title: 'Report', originalHtml: '<img>', issues: [] }).success).toBe(false)
})
