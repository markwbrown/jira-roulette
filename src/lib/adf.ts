import type { AdfNode } from '../types/jira'

const BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'blockquote',
  'listItem',
  'codeBlock',
  'tableRow',
  'panel',
])

/** Flatten an Atlassian Document Format tree to plain text for a short blurb. */
export function adfToPlainText(node: AdfNode | null | undefined): string {
  if (!node) return ''
  const parts: string[] = []
  walk(node, parts)
  return parts.join('').replace(/\s+/g, ' ').trim()
}

function walk(node: AdfNode, out: string[]): void {
  if (node.type === 'text' && node.text) {
    out.push(node.text)
  } else if (
    (node.type === 'mention' || node.type === 'emoji' || node.type === 'status') &&
    node.attrs
  ) {
    const text = node.attrs['text']
    if (typeof text === 'string') out.push(text)
  } else if (node.type === 'hardBreak') {
    out.push(' ')
  }
  if (node.content) {
    for (const child of node.content) walk(child, out)
  }
  if (BLOCK_TYPES.has(node.type)) out.push(' ')
}

export function truncate(text: string, max = 200): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}
