export default defineEventHandler(async (event) => {
  const reports = await userReports(event)
  return requireReport(await reports.get(validateReportId(event)))
})
