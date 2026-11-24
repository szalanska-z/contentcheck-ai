import { mountSuspended } from '@nuxt/test-utils/runtime'
import { expect, it } from 'vitest'
import AiSuggestions from '../../app/components/AiSuggestions.vue'
import type { SavedAnalysis } from '../../shared/types/analysis'

const report: SavedAnalysis = {
  id: '57a5d6a7-0b56-4bf4-83af-6d87f42e7910',
  title: 'Report',
  originalHtml: '<p>Original</p>',
  issues: [],
  createdAt: '2026-11-23T10:00:00.000Z',
  sourceAnalysisId: null,
  aiStatus: 'success',
  aiModel: null,
  aiMode: 'demo',
  generationMode: 'demo',
  aiSuggestions: [{ sourceId: 'segment-1', originalText: 'Original', suggestedText: 'Proposed rewrite', reason: 'Clearer.' }],
}

it('renders a saved demo suggestion without offering another generation', async () => {
  const view = await mountSuspended(AiSuggestions, { props: { report } })
  expect(view.text()).toContain('Tryb demo')
  expect(view.get('article').text()).toContain('Proposed rewrite')
  expect(view.find('button').exists()).toBe(false)
})

it('explains how to find a suggestion when a saved demo result is empty', async () => {
  const view = await mountSuspended(AiSuggestions, { props: { report: { ...report, aiSuggestions: [] } } })
  expect(view.get('[role="status"]').text()).toContain('Wstaw przykład')
  expect(view.get('a').attributes('href')).toBe('/app/new')
})

it('discloses the external request before a live generation', async () => {
  const view = await mountSuspended(AiSuggestions, {
    props: { report: { ...report, aiSuggestions: null, aiStatus: 'idle', aiMode: null, generationMode: 'live' } },
  })
  expect(view.text()).toContain('zostaną przesłane do OpenAI')
  expect(view.get('button').text()).toBe('Wygeneruj sugestie AI')
})
