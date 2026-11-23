import { parseFragment, type DefaultTreeAdapterTypes } from 'parse5'
import type { TextSegment } from '../schemas/ai'

export const maxSegments = 10
export const maxSegmentCharacters = 3000
export const demoOriginalText = 'W celu dokonania rejestracji należy wypełnić formularz zgłoszeniowy.'

type Element = DefaultTreeAdapterTypes.Element
const ignored = new Set(['script', 'style', 'template', 'noscript', 'head', 'svg', 'math', 'button', 'select', 'textarea', 'iframe'])
const editorial = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'dt', 'dd', 'blockquote', 'figcaption', 'td', 'th', 'pre'])
const block = new Set([...editorial, 'div', 'section', 'article', 'main', 'header', 'footer', 'ul', 'ol', 'dl', 'table', 'br', 'hr'])

export function extractTextSegments(html: string): TextSegment[] {
  type Node = DefaultTreeAdapterTypes.ChildNode
  type Frame = { node: Node, owner?: Element } | null
  const fragment = parseFragment(html)
  const pending: Frame[] = fragment.childNodes.map(node => ({ node })).reverse()
  const groups: { owner?: Element, parts: string[] }[] = []
  let split = true

  while (pending.length) {
    const frame = pending.pop()
    if (!frame) {
      split = true
      continue
    }
    const { node, owner } = frame
    if ('value' in node) {
      const current = groups.at(-1)
      if (split || !current || current.owner !== owner) groups.push({ owner, parts: [node.value] })
      else current.parts.push(node.value)
      split = false
    }
    if ('tagName' in node && !ignored.has(node.tagName)
      && !node.attrs.some(attr => attr.name === 'hidden' || (attr.name === 'aria-hidden' && attr.value === 'true'))) {
      const nextOwner = editorial.has(node.tagName) ? node : owner
      if (block.has(node.tagName)) {
        split = true
        pending.push(null)
      }
      for (let index = node.childNodes.length - 1; index >= 0; index--) {
        pending.push({ node: node.childNodes[index]!, owner: nextOwner })
      }
    }
  }

  const segments: TextSegment[] = []
  const seen = new Set<string>()
  let remaining = maxSegmentCharacters
  for (const { owner, parts } of groups) {
    const text = parts.join('').replaceAll('\u0000', ' ').replace(/\s+/g, ' ').trim()
    if (!text || seen.has(text)) continue
    const clipped = text.slice(0, remaining).replace(/[\uD800-\uDBFF]$/, '').trimEnd()
    if (!clipped) break
    segments.push({ id: 'segment-' + (segments.length + 1), tag: owner?.tagName ?? 'text', text: clipped })
    seen.add(text)
    remaining -= clipped.length
    if (remaining === 0 || clipped.length < text.length || segments.length === maxSegments) break
  }
  return segments
}
