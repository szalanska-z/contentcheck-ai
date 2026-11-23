import { createAnalysisInput } from '../../../shared/schemas/analysis'

export default defineEventHandler(async (event) => {
  const reports = await userReports(event)
  const input = validateReportInput(createAnalysisInput, await readReportJson(event, 64 * 1024))
  const report = requireReport(await reports.create(input))
  setResponseStatus(event, 201)
  return report
})
