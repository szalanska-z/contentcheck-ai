import { mountSuspended } from '@nuxt/test-utils/runtime'
import { expect, it } from 'vitest'
import AnalysisHistoryList from '../../app/components/AnalysisHistoryList.vue'

it('shows an empty history message', async () => {
  const view = await mountSuspended(AnalysisHistoryList, { props: { analyses: [] } })
  expect(view.text()).toContain('Brak raportów do wyświetlenia.')
  expect(view.find('a').exists()).toBe(false)
})

it('links to a saved report and shows the issue count', async () => {
  const view = await mountSuspended(AnalysisHistoryList, {
    props: { analyses: [{ id: 'report-id', title: 'Przykładowy raport', createdAt: '2026-11-23T10:00:00Z', issueCount: 3, aiStatus: 'idle' }] },
  })
  expect(view.get('a').attributes('href')).toBe('/app/analyses/report-id')
  expect(view.get('a').attributes('aria-label')).toBe('Otwórz raport: Przykładowy raport')
  expect(view.text()).toContain('Problemy: 3')
})
