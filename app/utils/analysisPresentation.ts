export const exampleHtml = '<img src="cover.jpg">\n<h2> </h2>\n<a href="/poradnik">Czytaj więcej</a>'
export const categoryLabels = { structure: 'Struktura', links: 'Linki', images: 'Obrazy' }

export function formatReportDate(date: string) {
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeZone: 'Europe/Warsaw' }).format(new Date(date))
}
