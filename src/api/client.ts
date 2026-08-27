export class JiraApiError extends Error {
  status: number
  messages: string[]

  constructor(status: number, messages: string[]) {
    super(messages.join('; ') || `Jira API error (HTTP ${status})`)
    this.name = 'JiraApiError'
    this.status = status
    this.messages = messages
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/jira${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    let messages: string[] = []
    try {
      const body = (await res.json()) as {
        errorMessages?: string[]
        errors?: Record<string, string>
      }
      messages = [
        ...(body.errorMessages ?? []),
        ...Object.values(body.errors ?? {}),
      ]
    } catch {
      // non-JSON error body (e.g. the proxy itself 404ing) — status alone is enough
    }
    throw new JiraApiError(res.status, messages)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const jiraGet = <T>(path: string): Promise<T> => request<T>(path)

export const jiraPost = <T>(path: string, body: unknown): Promise<T> =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) })

export const jiraPut = <T>(path: string, body: unknown): Promise<T> =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
