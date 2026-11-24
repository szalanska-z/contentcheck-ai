import { mountSuspended } from '@nuxt/test-utils/runtime'
import { expect, it } from 'vitest'
import AnalysisResults from '../../app/components/AnalysisResults.vue'
import { analyzeHtml } from '../../shared/utils/analyzeHtml'

it('filters the displayed findings and keeps source HTML inert', async () => {
  const issues = analyzeHtml('<img src="/image.png"><a href="/">Click here</a>')
  const view = await mountSuspended(AnalysisResults, { props: { issues } })
  expect(view.findAll('article')).toHaveLength(2)
  expect(view.get('code').text()).toBe('<img src="/image.png">')
  expect(view.find('img').exists()).toBe(false)

  const links = view.findAll('button').find(button => button.text() === 'Linki')!
  await links.trigger('click')
  expect(links.attributes('aria-pressed')).toBe('true')
  expect(view.findAll('article')).toHaveLength(1)
  expect(view.get('article').text()).toContain('Ogólny tekst linku')

  const structure = view.findAll('button').find(button => button.text() === 'Struktura')!
  await structure.trigger('click')
  expect(view.get('[role="status"]').text()).toContain('Brak problemów')
})
