import { parseFragment, type DefaultTreeAdapterTypes } from 'parse5'
import type { Issue } from '../types/analysis'

type Node = DefaultTreeAdapterTypes.ChildNode
type Element = DefaultTreeAdapterTypes.Element
type RuleId = Issue['ruleId']

const rules: Record<RuleId, Omit<Issue, 'id' | 'ruleId' | 'htmlSnippet'>> = {
  'img-missing-alt': {
    category: 'images', severity: 'warning',
    title: 'Brak atrybutu alt', description: 'Obraz nie ma atrybutu tekstu alternatywnego.',
    recommendation: 'Opisz znaczenie obrazu. Dla obrazu dekoracyjnego użyj pustego alt.',
  },
  'heading-empty': {
    category: 'structure', severity: 'warning',
    title: 'Pusty nagłówek', description: 'Nagłówek nie zawiera tekstu.',
    recommendation: 'Wprowadź tytuł sekcji albo usuń zbędny nagłówek.',
  },
  'link-generic-text': {
    category: 'links', severity: 'review',
    title: 'Ogólny tekst linku', description: 'Cel odnośnika może wymagać dodatkowego kontekstu.',
    recommendation: 'Jeśli cel linku jest niejasny, użyj nazwy strony lub dokumentu.',
  },
}

const ignored = new Set(['script', 'style', 'template', 'noscript'])

function* elements(nodes: Node[]): Generator<Element> {
  const pending = [...nodes].reverse()
  while (pending.length) {
    const node = pending.pop()!
    if ('tagName' in node && !ignored.has(node.tagName)) {
      yield node
      for (let index = node.childNodes.length - 1; index >= 0; index--) {
        pending.push(node.childNodes[index]!)
      }
    }
  }
}

function textContent(nodes: Node[]): string {
  const pending = [...nodes].reverse()
  const text: string[] = []
  while (pending.length) {
    const node = pending.pop()!
    if ('value' in node) text.push(node.value)
    if ('tagName' in node && !ignored.has(node.tagName)) {
      for (let index = node.childNodes.length - 1; index >= 0; index--) {
        pending.push(node.childNodes[index]!)
      }
    }
  }
  return text.join('').trim().replace(/\s+/g, ' ')
}

function matchingRule(node: Element): RuleId | undefined {
  if (node.namespaceURI !== 'http://www.w3.org/1999/xhtml') return
  if (node.tagName === 'img' && !node.attrs.some(attribute => attribute.name === 'alt')) return 'img-missing-alt'
  if (/^h[1-6]$/.test(node.tagName) && !textContent(node.childNodes)) return 'heading-empty'
  if (node.tagName === 'a' && node.attrs.some(attribute => attribute.name === 'href')
    && /^(kliknij tutaj|czytaj więcej|więcej|click here|read more)[.!…]?$/iu.test(textContent(node.childNodes))) return 'link-generic-text'
}

export function analyzeHtml(html: string): Issue[] {
  const fragment = parseFragment(html, { sourceCodeLocationInfo: true })
  const issues: Issue[] = []
  const usedIds = new Set<string>()
  for (const element of elements(fragment.childNodes)) {
    const location = element.sourceCodeLocation
    if (!location) continue
    const ruleId = matchingRule(element)
    if (!ruleId) continue
    const id = ruleId + '-' + location.startOffset
    if (usedIds.has(id)) continue
    usedIds.add(id)
    issues.push({
      ...rules[ruleId],
      id,
      ruleId,
      htmlSnippet: html.slice(location.startOffset, Math.min(location.endOffset, location.startOffset + 500)),
    })
  }
  return issues
}
