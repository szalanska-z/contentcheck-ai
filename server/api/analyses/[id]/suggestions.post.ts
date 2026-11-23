import { getDatabase } from '../../../db/client'
import { createSuggestionProvider } from '../../../services/aiProvider'
import { generateSuggestions } from '../../../services/suggestionService'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  checkReportOrigin(event)
  const id = validateReportId(event)
  const config = useRuntimeConfig(event)
  const provider = createSuggestionProvider({
    mode: config.aiMode,
    model: typeof config.openaiModel === 'string' ? config.openaiModel : '',
    apiKey: typeof config.openaiApiKey === 'string' ? config.openaiApiKey : '',
    allowProductionLive: config.aiAllowProductionLive === true,
    production: !import.meta.dev,
  })
  const outcome = await generateSuggestions(getDatabase(), user.id, id, provider)
  if (outcome.kind === 'saved') return outcome.result

  const status = {
    missing: 404,
    'in-progress': 409,
    limit: 429,
    configuration: 503,
    timeout: 504,
    'invalid-response': 502,
    'provider-error': 502,
  }[outcome.kind]
  throw createError({ statusCode: status, data: { reason: outcome.kind } })
})
