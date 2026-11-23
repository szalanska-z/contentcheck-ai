export default defineNuxtRouteMiddleware(async (to) => {
  const requiresSession = to.path === '/app' || to.path.startsWith('/app/')

  const account = useAccount()
  const request = useRequestFetch()
  try {
    const session = await request('/api/session', { retry: 0 })
    if (account.value && account.value.id !== session.id) clearNuxtData()
    account.value = session
  } catch (error) {
    if (account.value) clearNuxtData()
    account.value = null
    if (!requiresSession) return
    if ((error as { statusCode?: number }).statusCode === 401) {
      return navigateTo('/login')
    }
    return abortNavigation(createError({ statusCode: 503, statusMessage: 'Logowanie jest chwilowo niedostępne.' }))
  }
})
