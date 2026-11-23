export default defineEventHandler(async (event) => {
  const reports = await userReports(event)
  checkReportOrigin(event)
  requireReport(await reports.remove(validateReportId(event)))
  setResponseStatus(event, 204)
})
