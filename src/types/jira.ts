export interface JiraProject {
  id: string
  key: string
  name: string
  simplified?: boolean
  style?: string
}

export interface AdfNode {
  type: string
  text?: string
  attrs?: Record<string, unknown>
  content?: AdfNode[]
}

export interface JiraUser {
  accountId: string
  displayName: string
  avatarUrls?: Record<string, string>
  accountType?: string
}

export type StatusCategoryKey = 'new' | 'indeterminate' | 'done'

export interface JiraStatus {
  id: string
  name: string
  statusCategory?: { key: StatusCategoryKey; name?: string }
}

export interface JiraIssue {
  id: string
  key: string
  self: string
  fields: {
    summary: string
    status: JiraStatus
    assignee: JiraUser | null
    description: AdfNode | null
    issuetype?: { id: string; name: string; iconUrl?: string }
    parent?: { key: string; fields?: { summary?: string } }
  }
}

export interface JiraSprint {
  id: number
  name: string
  state: string
  startDate?: string
}

export interface JiraBoard {
  id: number
  name: string
  type: string
}

export interface ProjectStatus {
  id: string
  name: string
  categoryKey: StatusCategoryKey | 'other'
}

export type StatusMode = 'not-done' | 'todo' | 'in-progress' | 'all' | 'custom'

export interface Filters {
  projectKey: string | null
  epicKey: string | null
  sprintId: number | null
  statusMode: StatusMode
  statusNames: string[]
}
