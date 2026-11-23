import { describe, expect, it } from 'vitest'
import { analyzeHtml } from '../../shared/utils/analyzeHtml'

describe('analyzeHtml', () => {
  it('reports an image with no alt attribute', () => {
    const html = '<img src="photo.jpg">'
    const issues = analyzeHtml(html)

    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ ruleId: 'img-missing-alt', category: 'images', htmlSnippet: html })
  })

  it.each(['<img alt="">', '<img alt="Desk">'])('accepts the alt attribute in %s', (html) => {
    expect(analyzeHtml(html)).toEqual([])
  })

  it.each(['<h2></h2>', '<h3> &nbsp; </h3>', '<h6><span></span></h6>'])('reports the empty heading in %s', (html) => {
    expect(analyzeHtml(html)[0]?.ruleId).toBe('heading-empty')
  })

  it.each(['Kliknij tutaj', 'Czytaj więcej', 'Więcej', 'Click here', 'Read more'])('marks the link text %s for review', (label) => {
    expect(analyzeHtml('<a href="/guide"><span>' + label + '</span></a>')[0])
      .toMatchObject({ ruleId: 'link-generic-text', severity: 'review' })
  })

  it('accepts a specific link and a descriptive heading', () => {
    expect(analyzeHtml('<h1>Guide</h1><a href="/guide">Download the guide</a><img alt="Cover">')).toEqual([])
  })

  it('gives repeated findings distinct and reproducible identifiers', () => {
    const html = '<h2></h2><img><img><a href="/">Read more.</a>'
    const issues = analyzeHtml(html)
    expect(issues.map(issue => issue.ruleId)).toEqual(['heading-empty', 'img-missing-alt', 'img-missing-alt', 'link-generic-text'])
    expect(new Set(issues.map(issue => issue.id)).size).toBe(4)
    expect(analyzeHtml(html)).toEqual(issues)
  })

  it('treats comments and scripts as inert input', () => {
    expect(analyzeHtml('<!-- <img> --><script>let html = "<img>";</script>')).toEqual([])
  })
})
