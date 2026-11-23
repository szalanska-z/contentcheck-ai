import { listAnalysesInput } from '../../../shared/schemas/analysis'

export default defineEventHandler(async (event) => {
  const reports = await userReports(event)
  return reports.list(validateReportInput(listAnalysesInput, getQuery(event)))
})
