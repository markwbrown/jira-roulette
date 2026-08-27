import type { Filters } from '../types/jira'

export function escapeJqlString(value: string): string {
  return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
}

export function buildJql(filters: Filters): string | null {
  if (!filters.projectKey) return null
  const clauses = [`project = ${escapeJqlString(filters.projectKey)}`]
  if (filters.epicKey) clauses.push(`parent = ${escapeJqlString(filters.epicKey)}`)
  if (filters.sprintId != null) clauses.push(`sprint = ${filters.sprintId}`)

  if (filters.statusMode === 'custom' && filters.statusNames.length > 0) {
    clauses.push(`status IN (${filters.statusNames.map(escapeJqlString).join(', ')})`)
  } else if (filters.statusMode === 'not-done') {
    clauses.push('statusCategory IN ("To Do", "In Progress")')
  } else if (filters.statusMode === 'todo') {
    clauses.push('statusCategory = "To Do"')
  } else if (filters.statusMode === 'in-progress') {
    clauses.push('statusCategory = "In Progress"')
  }
  // 'all' (and 'custom' with nothing checked) adds no status clause

  return clauses.join(' AND ') + ' ORDER BY key ASC'
}
