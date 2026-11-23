export default defineEventHandler(async (event) => {
  const reports = await userReports(event)
  const report = requireReport(await reports.get(validateReportId(event)))
  const generationMode = useRuntimeConfig(event).aiMode === 'live' ? 'live' : 'demo'
  return { ...report, generationMode }
})
