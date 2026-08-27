import { describe, expect, it } from 'vitest'
import { buildJql, escapeJqlString } from './jql'
import { initialFilters } from './filters'

describe('escapeJqlString', () => {
  it('wraps in quotes', () => {
    expect(escapeJqlString('ROUL')).toBe('"ROUL"')
  })

  it('escapes embedded quotes and backslashes', () => {
    expect(escapeJqlString('a "b" c\\d')).toBe('"a \\"b\\" c\\\\d"')
  })
})

describe('buildJql', () => {
  it('returns null without a project', () => {
    expect(buildJql(initialFilters)).toBeNull()
  })

  it('defaults to not-done', () => {
    expect(buildJql({ ...initialFilters, projectKey: 'ROUL' })).toBe(
      'project = "ROUL" AND statusCategory IN ("To Do", "In Progress") ORDER BY key ASC',
    )
  })

  it('combines epic, sprint, and custom statuses', () => {
    expect(
      buildJql({
        projectKey: 'ROUL',
        epicKey: 'ROUL-1',
        sprintId: 42,
        statusMode: 'custom',
        statusNames: ['Ready for Dev', 'Planning'],
      }),
    ).toBe(
      'project = "ROUL" AND parent = "ROUL-1" AND sprint = 42 AND ' +
        'status IN ("Ready for Dev", "Planning") ORDER BY key ASC',
    )
  })

  it('adds no status clause for all', () => {
    expect(
      buildJql({ ...initialFilters, projectKey: 'ROUL', statusMode: 'all' }),
    ).toBe('project = "ROUL" ORDER BY key ASC')
  })

  it('treats custom-with-nothing-checked as no status clause', () => {
    expect(
      buildJql({ ...initialFilters, projectKey: 'ROUL', statusMode: 'custom' }),
    ).toBe('project = "ROUL" ORDER BY key ASC')
  })
})
