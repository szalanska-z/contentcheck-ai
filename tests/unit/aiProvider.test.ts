import OpenAI from 'openai'
import { expect, it, vi } from 'vitest'
import { createSuggestionProvider } from '../../server/services/aiProvider'
import { validateSuggestions } from '../../shared/schemas/ai'
import { demoOriginalText } from '../../shared/utils/extractTextSegments'

const config = { mode: 'live', model: 'test-model', apiKey: 'test-only', production: false, allowProductionLive: false }
const segments = [{ id: 'segment-1', tag: 'p', text: 'Please endeavor to respond.' }]
const suggestion = {
  sourceId: 'segment-1',
  originalText: segments[0]!.text,
  suggestedText: 'Please respond.',
  reason: 'Removes unnecessary words.',
}

it('rejects unmatched IDs, changed source text and invalid data', () => {
  expect(validateSuggestions({ suggestions: [{ ...suggestion, sourceId: 'unknown' }] }, segments)).toBeUndefined()
  expect(validateSuggestions({ suggestions: [{ ...suggestion, originalText: 'Changed' }] }, segments)).toBeUndefined()
  expect(validateSuggestions({ suggestions: [{ ...suggestion, reason: 42 }] }, segments)).toBeUndefined()
  expect(validateSuggestions({ suggestions: Array(4).fill(suggestion) }, segments)).toBeUndefined()
})

it('uses real SDK request serialization against a fake network response', async () => {
  const fakeFetch = vi.fn(async (_url: unknown, options?: RequestInit) => {
    const payload = JSON.parse(String(options?.body))
    expect(payload).toMatchObject({ store: false, text: { format: { type: 'json_schema', strict: true } } })
    expect(JSON.parse(payload.input[0].content)).toEqual({ segments })
    return Response.json({
      status: 'completed',
      model: 'test-model-snapshot',
      output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ suggestions: [suggestion] }) }] }],
    })
  })
  const provider = createSuggestionProvider(config, apiKey => new OpenAI({ apiKey, fetch: fakeFetch, maxRetries: 0 }))!
  await expect(provider.generate(segments)).resolves.toEqual({ model: 'test-model-snapshot', suggestions: [suggestion] })
  expect(fakeFetch).toHaveBeenCalledTimes(1)
})

it('handles timeouts and invalid provider responses separately', async () => {
  const timeoutFetch = vi.fn(async () => { throw new OpenAI.APIConnectionTimeoutError() })
  const timeout = createSuggestionProvider(config, apiKey => new OpenAI({ apiKey, fetch: timeoutFetch, maxRetries: 0 }))!
  await expect(timeout.generate(segments)).rejects.toMatchObject({ kind: 'timeout' })
  const malformed = createSuggestionProvider(config, apiKey => new OpenAI({
    apiKey, maxRetries: 0,
    fetch: async () => Response.json({ status: 'completed', model: 'test', output: [{ type: 'message', content: [{ type: 'output_text', text: '{' }] }] }),
  }))!
  await expect(malformed.generate(segments)).rejects.toMatchObject({ kind: 'invalid-response' })
})

it('keeps demo offline and requires explicit production opt-in', async () => {
  const createClient = vi.fn(() => { throw new Error('Unexpected SDK call') })
  const demo = createSuggestionProvider({ ...config, mode: 'demo' }, createClient)!
  expect(await demo.generate(segments)).toEqual({ model: null, suggestions: [] })
  expect((await demo.generate([{ ...segments[0]!, text: demoOriginalText }])).suggestions).toHaveLength(1)
  expect(createClient).not.toHaveBeenCalled()
  expect(createSuggestionProvider({ ...config, production: true })).toBeUndefined()
  expect(createSuggestionProvider({ ...config, production: true, allowProductionLive: true })?.mode).toBe('live')
})
