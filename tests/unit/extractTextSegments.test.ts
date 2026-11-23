import { expect, it } from 'vitest'
import { extractTextSegments, maxSegmentCharacters, maxSegments } from '../../shared/utils/extractTextSegments'

it('combines inline text into one editorial segment', () => {
  const segments = extractTextSegments('<p>Hello <strong>world</strong>!</p>')
  expect(segments).toEqual([{ id: 'segment-1', tag: 'p', text: 'Hello world!' }])
})

it('ignores empty and non-editorial content', () => {
  const html = '<p> &nbsp; </p><script>alert(1)</script><style>p{color:red}</style><template><p>Template</p></template><p hidden>Hidden</p><p>Visible</p>'
  expect(extractTextSegments(html)).toEqual([{ id: 'segment-1', tag: 'p', text: 'Visible' }])
})

it('keeps nested blocks separate without duplicating their text and uses stable IDs', () => {
  const html = '<ul><li>First<p>Nested copy</p>Third</li></ul><p>Nested copy</p>'
  const segments = extractTextSegments(html)
  expect(segments.map(segment => segment.text)).toEqual(['First', 'Nested copy', 'Third'])
  expect(new Set(segments.map(segment => segment.id)).size).toBe(3)
  expect(extractTextSegments(html)).toEqual(segments)
})

it('limits the number and cumulative length of segments', () => {
  const html = Array.from({ length: 12 }, (_, index) => '<p>Text ' + index + '</p>').join('')
  expect(extractTextSegments(html)).toHaveLength(maxSegments)
  const segments = extractTextSegments('<p>' + 'a'.repeat(2999) + '</p><p>second</p>')
  expect(segments.reduce((sum, segment) => sum + segment.text.length, 0)).toBe(maxSegmentCharacters)
})
