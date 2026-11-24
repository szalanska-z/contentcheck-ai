import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'

test('registers, saves an analysis, reopens suggestions and reuses the source HTML', async ({ page }, testInfo) => {
  const email = randomUUID() + '@example.test'
  const password = 'local-report-fixture'
  const title = 'Raport z testu przeglądarkowego'

  await page.goto('/app')
  await expect(page).toHaveURL(/\/login$/)
  const guest = await page.request.get('/api/analyses')
  expect(guest.status()).toBe(401)

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Przejdź do treści' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()

  await page.getByRole('link', { name: 'Zarejestruj się' }).click()
  await page.getByLabel('Imię').fill('Redaktorka testowa')
  await page.getByLabel('Adres e-mail').fill(email)
  await page.getByLabel('Hasło', { exact: true }).fill(password)
  await page.getByLabel('Potwierdź hasło').fill(password)
  await page.getByRole('button', { name: 'Załóż konto' }).click()
  await expect(page.getByRole('heading', { name: 'Witaj ponownie, Redaktorka testowa!' })).toBeVisible()

  await page.getByRole('navigation', { name: 'Panel użytkownika' }).getByRole('link', { name: 'Nowa analiza' }).click()
  await page.getByRole('button', { name: 'Wstaw przykład' }).click()
  const originalHtml = await page.getByLabel('Fragment HTML').inputValue()
  await page.getByRole('button', { name: 'Analizuj', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Wyniki analizy 3' })).toBeVisible()
  await page.getByLabel('Nazwa raportu').fill(title)
  await page.getByRole('button', { name: 'Zapisz raport' }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  await page.getByRole('button', { name: 'Pokaż sugestie demo' }).click()
  const suggestions = page.getByRole('region', { name: 'Sugestie językowe' })
  await expect(suggestions).toContainText('Aby się zarejestrować, wypełnij formularz zgłoszeniowy.')
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await suggestions.scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath('mobile-report.png') })
  await page.getByRole('link', { name: 'Historia' }).click()
  await page.getByRole('link', { name: 'Otwórz raport: ' + title }).click()
  await expect(suggestions).toContainText('Aby się zarejestrować, wypełnij formularz zgłoszeniowy.')
  await page.getByRole('link', { name: 'Użyj ponownie' }).click()
  await expect(page.getByLabel('Fragment HTML')).toHaveValue(originalHtml)

  await page.getByRole('button', { name: 'Wyloguj się' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Adres e-mail').fill(email)
  await page.getByLabel('Hasło', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Zaloguj się' }).click()
  await expect(page.getByRole('heading', { name: 'Witaj ponownie, Redaktorka testowa!' })).toBeVisible()
})
