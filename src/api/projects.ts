import { jiraGet } from './client'
import type { JiraProject, JiraUser, ProjectStatus, StatusCategoryKey } from '../types/jira'

interface ProjectSearchPage {
  values: JiraProject[]
  isLast: boolean
}

export async function listProjects(): Promise<JiraProject[]> {
  const all: JiraProject[] = []
  let startAt = 0
  for (;;) {
    const page = await jiraGet<ProjectSearchPage>(
      `/rest/api/3/project/search?orderBy=key&maxResults=100&startAt=${startAt}`,
    )
    all.push(...page.values)
    if (page.isLast || page.values.length === 0) break
    startAt += page.values.length
  }
  return all
}

export async function fetchMyself(): Promise<JiraUser> {
  return jiraGet<JiraUser>('/rest/api/3/myself')
}

interface IssueTypeStatuses {
  statuses: Array<{
    id: string
    name: string
    statusCategory?: { key?: string }
  }>
}

export async function listProjectStatuses(projectKey: string): Promise<ProjectStatus[]> {
  const issueTypes = await jiraGet<IssueTypeStatuses[]>(
    `/rest/api/3/project/${encodeURIComponent(projectKey)}/statuses`,
  )
  const byId = new Map<string, ProjectStatus>()
  for (const issueType of issueTypes) {
    for (const status of issueType.statuses) {
      if (byId.has(status.id)) continue
      const key = status.statusCategory?.key
      const categoryKey: ProjectStatus['categoryKey'] =
        key === 'new' || key === 'indeterminate' || key === 'done'
          ? (key as StatusCategoryKey)
          : 'other'
      byId.set(status.id, { id: status.id, name: status.name, categoryKey })
    }
  }
  return [...byId.values()]
}
