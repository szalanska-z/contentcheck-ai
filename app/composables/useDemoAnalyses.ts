import type { DemoAnalysis } from '#shared/types/analysis'

export function useDemoAnalyses() {
  return useState<DemoAnalysis[]>('demo-analyses', () => [demoAnalysis])
}
