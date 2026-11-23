export default defineEventHandler(async (event) => {
  const reports = await userReports(event)
  return reports.dashboard()
})
