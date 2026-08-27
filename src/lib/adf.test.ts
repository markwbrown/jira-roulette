import { describe, expect, it } from 'vitest'
import { adfToPlainText, truncate } from './adf'
import type { AdfNode } from '../types/jira'

const doc = (...content: AdfNode[]): AdfNode => ({ type: 'doc', content })

describe('adfToPlainText', () => {
  it('handles null and undefined', () => {
    expect(adfToPlainText(null)).toBe('')
    expect(adfToPlainText(undefined)).toBe('')
  })

  it('flattens paragraphs with spacing between blocks', () => {
    const result = adfToPlainText(
      doc(
        { type: 'paragraph', content: [{ type: 'text', text: 'First.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second.' }] },
      ),
    )
    expect(result).toBe('First. Second.')
  })

  it('renders mentions, emoji, and statuses via attrs.text', () => {
    const result = adfToPlainText(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Ping ' },
          { type: 'mention', attrs: { text: '@ada' } },
          { type: 'text', text: ' when ' },
          { type: 'status', attrs: { text: 'DONE' } },
        ],
      }),
    )
    expect(result).toBe('Ping @ada when DONE')
  })

  it('skips media-only documents gracefully', () => {
    const result = adfToPlainText(
      doc({ type: 'mediaSingle', content: [{ type: 'media', attrs: { id: 'x' } }] }),
    )
    expect(result).toBe('')
  })

  it('collapses hard breaks and whitespace', () => {
    const result = adfToPlainText(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'a' },
          { type: 'hardBreak' },
          { type: 'text', text: 'b' },
        ],
      }),
    )
    expect(result).toBe('a b')
  })
})

describe('truncate', () => {
  it('leaves short text alone', () => {
    expect(truncate('short', 10)).toBe('short')
  })

  it('adds an ellipsis within the budget', () => {
    const result = truncate('a'.repeat(50), 10)
    expect(result.length).toBeLessThanOrEqual(10)
    expect(result.endsWith('…')).toBe(true)
  })
})
