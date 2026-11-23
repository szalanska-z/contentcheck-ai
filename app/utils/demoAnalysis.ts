import type { DemoAnalysis, Issue } from '#shared/types/analysis'

export const htmlLimit = 10_000

const issues: Issue[] = [
  {
    id: 'img-missing-alt-1', ruleId: 'img-missing-alt', category: 'images', severity: 'warning',
    title: 'Brak atrybutu alt', description: 'Obraz nie ma atrybutu tekstu alternatywnego.',
    recommendation: 'Opisz znaczenie obrazu. Dla obrazu dekoracyjnego użyj pustego alt.',
    htmlSnippet: '<img src="cover.jpg">',
  },
  {
    id: 'heading-empty-1', ruleId: 'heading-empty', category: 'structure', severity: 'warning',
    title: 'Pusty nagłówek', description: 'Nagłówek nie zawiera tekstu.',
    recommendation: 'Wprowadź tytuł sekcji albo usuń zbędny nagłówek.',
    htmlSnippet: '<h2> </h2>',
  },
  {
    id: 'link-generic-text-1', ruleId: 'link-generic-text', category: 'links', severity: 'review',
    title: 'Ogólny tekst linku', description: 'Cel odnośnika może wymagać dodatkowego kontekstu.',
    recommendation: 'Jeśli cel linku jest niejasny, użyj nazwy strony lub dokumentu.',
    htmlSnippet: '<a href="/poradnik">Czytaj więcej</a>',
  },
]

export const demoAnalysis: DemoAnalysis = {
  id: 'przyklad',
  title: 'Artykuł do publikacji',
  originalHtml: issues.map(issue => issue.htmlSnippet).join('\n'),
  issues,
  createdAt: '2026-11-18',
}

export const categoryLabels = { structure: 'Struktura', links: 'Linki', images: 'Obrazy' }
