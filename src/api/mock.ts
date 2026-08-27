import type {
  AdfNode,
  Filters,
  JiraIssue,
  JiraProject,
  JiraSprint,
  JiraUser,
  ProjectStatus,
} from '../types/jira'
import type { IssueSearchResult } from './issues'

export const mockEnabled =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('mock')

const MOCK_ORIGIN = 'https://mock.atlassian.net'

export const mockProjects: JiraProject[] = [
  { id: '10000', key: 'ROUL', name: 'Roulette Demo', simplified: true },
  { id: '10001', key: 'OPS', name: 'Operations (empty)', simplified: false },
]

export const mockUsers: JiraUser[] = [
  { accountId: 'u1', displayName: 'Ada Lovelace', accountType: 'atlassian' },
  { accountId: 'u2', displayName: 'Grace Hopper', accountType: 'atlassian' },
  { accountId: 'u3', displayName: 'Alan Turing', accountType: 'atlassian' },
  { accountId: 'u4', displayName: 'Katherine Johnson', accountType: 'atlassian' },
  { accountId: 'u5', displayName: 'Edsger Dijkstra', accountType: 'atlassian' },
]

export const mockSprints: JiraSprint[] = [
  { id: 1, name: 'Sprint 41', state: 'active' },
  { id: 2, name: 'Sprint 42', state: 'future' },
]

const STATUSES: Array<{ id: string; name: string; categoryKey: ProjectStatus['categoryKey'] }> = [
  { id: 's1', name: 'Backlog', categoryKey: 'new' },
  { id: 's2', name: 'Planning', categoryKey: 'new' },
  { id: 's3', name: 'Ready for Dev', categoryKey: 'new' },
  { id: 's4', name: 'In Progress', categoryKey: 'indeterminate' },
  { id: 's5', name: 'In Review', categoryKey: 'indeterminate' },
  { id: 's6', name: 'Done', categoryKey: 'done' },
]

export const mockStatuses: ProjectStatus[] = STATUSES

const SUMMARIES = [
  'Fix login redirect loop on expired session',
  'Add CSV export to the reports page',
  'Upgrade Postgres driver to v3',
  'Investigate flaky checkout integration test',
  'Rate-limit the public search endpoint',
  'Dark mode support for the settings screen',
  'Migrate legacy cron jobs to the scheduler service',
  'Improve empty-state copy on the dashboard',
  'Cache invalidation bug when renaming a workspace',
  'Add audit log entries for permission changes',
  'Refactor notification fan-out into a queue',
  'Spike: evaluate feature-flag providers',
  'Broken pagination on the admin user list',
  'Compress uploaded images over 5MB',
  'Add keyboard shortcuts for the editor',
  'Timeout errors from the payments webhook',
  'Localize date formats for EU customers',
  'Clean up orphaned records in the attachments table',
  'Onboarding checklist progress not persisting',
  'Reduce bundle size of the vendor chunk',
]

function makeDescription(i: number): AdfNode | null {
  if (i % 3 === 2) return null
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: `Reported by support. ${SUMMARIES[i % SUMMARIES.length]} — needs triage, repro steps in the linked thread. Impact is limited to a subset of customers but noisy.`,
          },
        ],
      },
    ],
  }
}

interface MockIssueExtra {
  sprintId: number | null
}

const mockEpics: JiraIssue[] = [1, 2, 3].map((n) => ({
  id: `e${n}`,
  key: `ROUL-${n}`,
  self: `${MOCK_ORIGIN}/rest/api/3/issue/e${n}`,
  fields: {
    summary: ['Billing revamp', 'Editor performance', 'Q3 platform hygiene'][n - 1],
    status: { id: 's4', name: 'In Progress', statusCategory: { key: 'indeterminate' } },
    assignee: null,
    description: null,
    issuetype: { id: 'epic', name: 'Epic' },
  },
}))

const mockIssues: Array<JiraIssue & { extra: MockIssueExtra }> = Array.from(
  { length: 40 },
  (_, i) => {
    const status = STATUSES[i % STATUSES.length]
    const epic = i % 4 === 0 ? null : mockEpics[i % 3]
    return {
      id: `i${i}`,
      key: `ROUL-${100 + i}`,
      self: `${MOCK_ORIGIN}/rest/api/3/issue/i${i}`,
      extra: { sprintId: i % 5 === 0 ? null : mockSprints[i % 2].id },
      fields: {
        summary: SUMMARIES[i % SUMMARIES.length],
        status: {
          id: status.id,
          name: status.name,
          statusCategory: {
            key: status.categoryKey === 'other' ? 'new' : status.categoryKey,
          },
        },
        assignee: i % 3 === 0 ? mockUsers[i % mockUsers.length] : null,
        description: makeDescription(i),
        issuetype: { id: 'task', name: i % 2 ? 'Task' : 'Bug' },
        ...(epic ? { parent: { key: epic.key, fields: { summary: epic.fields.summary } } } : {}),
      },
    }
  },
)

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function mockListProjects(): Promise<JiraProject[]> {
  await delay(200)
  return mockProjects
}

export async function mockListEpics(projectKey: string): Promise<JiraIssue[]> {
  await delay(200)
  return projectKey === 'ROUL' ? mockEpics : []
}

export async function mockListSprints(projectKey: string): Promise<JiraSprint[]> {
  await delay(200)
  return projectKey === 'ROUL' ? mockSprints : []
}

export async function mockListProjectStatuses(projectKey: string): Promise<ProjectStatus[]> {
  await delay(150)
  return projectKey === 'ROUL' ? mockStatuses : []
}

export async function mockSearchIssues(filters: Filters): Promise<IssueSearchResult> {
  await delay(400)
  if (filters.projectKey !== 'ROUL') return { issues: [], truncated: false }
  const issues = mockIssues.filter((issue) => {
    if (filters.epicKey && issue.fields.parent?.key !== filters.epicKey) return false
    if (filters.sprintId != null && issue.extra.sprintId !== filters.sprintId) return false
    const category = issue.fields.status.statusCategory?.key
    const name = issue.fields.status.name
    switch (filters.statusMode) {
      case 'not-done':
        return category !== 'done'
      case 'todo':
        return category === 'new'
      case 'in-progress':
        return category === 'indeterminate'
      case 'custom':
        return filters.statusNames.length === 0 || filters.statusNames.includes(name)
      case 'all':
        return true
    }
  })
  return { issues, truncated: false }
}

export async function mockSearchAssignableUsers(
  _projectKey: string,
  query: string,
): Promise<JiraUser[]> {
  await delay(150)
  const q = query.trim().toLowerCase()
  return q ? mockUsers.filter((u) => u.displayName.toLowerCase().includes(q)) : mockUsers
}

export async function mockAssignIssue(
  issueKey: string,
  accountId: string | null,
): Promise<void> {
  await delay(300)
  const issue = mockIssues.find((i) => i.key === issueKey)
  if (issue) {
    issue.fields.assignee = accountId
      ? (mockUsers.find((u) => u.accountId === accountId) ?? null)
      : null
  }
}
