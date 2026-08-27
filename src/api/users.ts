import { jiraGet, jiraPut } from './client'
import type { JiraUser } from '../types/jira'

export async function searchAssignableUsers(
  projectKey: string,
  query: string,
): Promise<JiraUser[]> {
  const users = await jiraGet<JiraUser[]>(
    `/rest/api/3/user/assignable/search?project=${encodeURIComponent(projectKey)}` +
      `&query=${encodeURIComponent(query)}&maxResults=50`,
  )
  // hide app/bot accounts
  return users.filter((u) => u.accountType === 'atlassian' || u.accountType === undefined)
}

export async function assignIssue(
  issueKey: string,
  accountId: string | null,
): Promise<void> {
  await jiraPut<void>(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/assignee`, {
    accountId,
  })
}
