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

export interface DemoAnalysis {
  id: string
  title: string
  originalHtml: string
  issues: Issue[]
  createdAt: string
}
