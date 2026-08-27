import { jiraPost } from './client'
import { escapeJqlString } from '../lib/jql'
import type { JiraIssue } from '../types/jira'

export const ISSUE_FETCH_CAP = 400

const ISSUE_FIELDS = ['summary', 'status', 'assignee', 'description', 'issuetype', 'parent']

interface SearchPage {
  issues?: JiraIssue[]
  nextPageToken?: string
}

export interface IssueSearchResult {
  issues: JiraIssue[]
  truncated: boolean
  approxTotal?: number
}

export async function searchIssues(jql: string): Promise<IssueSearchResult> {
  const issues: JiraIssue[] = []
  let nextPageToken: string | undefined
  let truncated = false
  for (;;) {
    const page = await jiraPost<SearchPage>('/rest/api/3/search/jql', {
      jql,
      maxResults: 100,
      fields: ISSUE_FIELDS,
      ...(nextPageToken ? { nextPageToken } : {}),
    })
    issues.push(...(page.issues ?? []))
    nextPageToken = page.nextPageToken
    if (!nextPageToken) break
    if (issues.length >= ISSUE_FETCH_CAP) {
      truncated = true
      break
    }
  }

  let approxTotal: number | undefined
  if (truncated) {
    try {
      const result = await jiraPost<{ count: number }>(
        '/rest/api/3/search/approximate-count',
        { jql },
      )
      approxTotal = result.count
    } catch {
      // count is a nice-to-have for the truncation banner only
    }
  }
  return { issues, truncated, approxTotal }
}

export async function listEpics(projectKey: string): Promise<JiraIssue[]> {
  const result = await jiraPost<SearchPage>('/rest/api/3/search/jql', {
    jql: `project = ${escapeJqlString(projectKey)} AND issuetype = Epic ORDER BY created DESC`,
    maxResults: 100,
    fields: ['summary', 'status'],
  })
  return result.issues ?? []
}
