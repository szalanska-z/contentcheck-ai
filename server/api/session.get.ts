export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return { id: user.id, name: user.name }
})
