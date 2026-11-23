import { renameAnalysisInput } from '../../../shared/schemas/analysis'

export default defineEventHandler(async (event) => {
  const reports = await userReports(event)
  const id = validateReportId(event)
  const { title } = validateReportInput(renameAnalysisInput, await readReportJson(event, 1024))
  return requireReport(await reports.rename(id, title))
})
