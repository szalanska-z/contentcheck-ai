import { mountSuspended } from '@nuxt/test-utils/runtime'
import { expect, it } from 'vitest'
import HtmlEditor from '../../app/components/HtmlEditor.vue'
import { htmlLimit } from '../../shared/schemas/analysis'

it('emits HTML edits, inserts an example and submits analysis', async () => {
  const view = await mountSuspended(HtmlEditor, { props: { modelValue: '', error: '' } })
  const input = view.get('textarea')
  expect(input.attributes('maxlength')).toBe(String(htmlLimit))

  await input.setValue('<p>Edited</p>')
  expect(view.emitted('update:modelValue')).toEqual([['<p>Edited</p>']])

  const exampleButton = view.findAll('button').find(button => button.text() === 'Wstaw przykład')!
  await exampleButton.trigger('click')
  expect(view.emitted('update:modelValue')?.at(-1)?.[0]).toContain('W celu dokonania rejestracji')
  await view.get('form').trigger('submit')
  expect(view.emitted('analyze')).toHaveLength(1)
})

it('connects the textarea to its validation message', async () => {
  const view = await mountSuspended(HtmlEditor, { props: { modelValue: '', error: 'Wklej HTML.' } })
  expect(view.get('textarea').attributes('aria-invalid')).toBe('true')
  expect(view.get('textarea').attributes('aria-describedby')).toContain('html-error')
  expect(view.get('[role="alert"]').text()).toBe('Wklej HTML.')
})
