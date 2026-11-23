import { demoOriginalText } from '#shared/utils/extractTextSegments'

export const exampleHtml = '<img src="cover.jpg">\n<h2> </h2>\n<p>' + demoOriginalText + '</p>\n<a href="/poradnik">Czytaj więcej</a>'
export const categoryLabels = { structure: 'Struktura', links: 'Linki', images: 'Obrazy' }

export function formatReportDate(date: string) {
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeZone: 'Europe/Warsaw' }).format(new Date(date))
}

export function suggestionStatus(status: string) {
  if (status === 'success') return 'Sugestie sprawdzone'
  if (status === 'pending') return 'Sugestie w przygotowaniu'
  if (status === 'error') return 'Sugestie niedostępne'
  return 'Bez sugestii'
}
