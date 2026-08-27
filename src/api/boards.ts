import { jiraGet } from './client'
import type { JiraBoard, JiraSprint } from '../types/jira'

export async function listSprints(projectKey: string): Promise<JiraSprint[]> {
  const boards = await jiraGet<{ values: JiraBoard[] }>(
    `/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}&maxResults=50`,
  )
  const scrumBoards = boards.values.filter((b) => b.type === 'scrum')
  const sprints = new Map<number, JiraSprint>()
  for (const board of scrumBoards) {
    try {
      const page = await jiraGet<{ values: JiraSprint[] }>(
        `/rest/agile/1.0/board/${board.id}/sprint?state=active,future&maxResults=50`,
      )
      for (const sprint of page.values) sprints.set(sprint.id, sprint)
    } catch {
      // board doesn't support sprints — treat as having none
    }
  }
  return [...sprints.values()]
}
