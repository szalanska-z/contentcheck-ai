import { z } from 'zod'

export const maxSuggestions = 3
export const aiSuggestionSchema = z.strictObject({
  sourceId: z.string(),
  originalText: z.string(),
  suggestedText: z.string(),
  reason: z.string(),
})

// The SDK converts this shape to the JSON Schema accepted by Responses.
export const aiResponseSchema = z.strictObject({ suggestions: z.array(aiSuggestionSchema) })

export type AiMode = 'demo' | 'live'
export type AiSuggestion = z.infer<typeof aiSuggestionSchema>
export type TextSegment = { id: string, tag: string, text: string }

export function validateSuggestions(value: unknown, segments: TextSegment[]) {
  const parsed = aiResponseSchema.safeParse(value)
  if (!parsed.success || parsed.data.suggestions.length > maxSuggestions) return
  const originals = new Map(segments.map(segment => [segment.id, segment.text]))
  const seen = new Set<string>()
  for (const suggestion of parsed.data.suggestions) {
    if (originals.get(suggestion.sourceId) !== suggestion.originalText || seen.has(suggestion.sourceId)
      || !suggestion.suggestedText.trim() || suggestion.suggestedText.length > 1500
      || suggestion.suggestedText.trim() === suggestion.originalText
      || !suggestion.reason.trim() || suggestion.reason.length > 500
      || [suggestion.suggestedText, suggestion.reason].some(text => text.includes('\u0000'))) return
    seen.add(suggestion.sourceId)
  }
  return parsed.data.suggestions
}
