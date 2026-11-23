import type { AiMode, AiSuggestion } from '../schemas/ai'

export type Category = 'structure' | 'links' | 'images'

export interface Issue {
  id: string
  ruleId: 'img-missing-alt' | 'heading-empty' | 'link-generic-text'
  category: Category
  severity: 'warning' | 'review'
  title: string
  description: string
  recommendation: string
  htmlSnippet: string
}

export interface AnalysisSummary {
  id: string
  title: string
  issueCount: number
  aiStatus: string
  createdAt: string
}

export interface SavedAnalysis {
  id: string
  title: string
  originalHtml: string
  issues: Issue[]
  createdAt: string
  sourceAnalysisId: string | null
  aiStatus: string
  aiModel: string | null
  aiSuggestions: AiSuggestion[] | null
  aiMode: AiMode | null
  generationMode: AiMode
}

export interface SuggestionResult {
  aiSuggestions: AiSuggestion[]
  aiMode: AiMode
  aiModel: string | null
}

export interface AnalysisPage {
  items: AnalysisSummary[]
  page: number
  limit: number
  total: number
}

export interface DashboardData {
  recent: AnalysisSummary[]
  total: number
  issueCount: number
  withSuggestions: number
}
