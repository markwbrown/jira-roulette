import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { JiraApiError } from '../api/client'
import { fetchMyself, listProjects, listProjectStatuses } from '../api/projects'
import { listSprints } from '../api/boards'
import { listEpics, searchIssues, type IssueSearchResult } from '../api/issues'
import { assignIssue, searchAssignableUsers } from '../api/users'
import {
  mockAssignIssue,
  mockEnabled,
  mockListEpics,
  mockListProjects,
  mockListProjectStatuses,
  mockListSprints,
  mockSearchAssignableUsers,
  mockSearchIssues,
} from '../api/mock'
import { buildJql } from '../lib/jql'
import type { Filters } from '../types/jira'

export function useMyself() {
  return useQuery({
    queryKey: ['myself'],
    queryFn: fetchMyself,
    enabled: !mockEnabled,
    retry: false,
    staleTime: Infinity,
  })
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: mockEnabled ? mockListProjects : listProjects,
    staleTime: 5 * 60_000,
  })
}

export function useEpics(projectKey: string | null) {
  return useQuery({
    queryKey: ['epics', projectKey],
    queryFn: async () => {
      if (mockEnabled) return mockListEpics(projectKey!)
      try {
        return await listEpics(projectKey!)
      } catch (err) {
        // e.g. an instance whose epic issue type was renamed — the JQL 400s;
        // treat as "no epics" so the filter just stays unavailable
        if (err instanceof JiraApiError && err.status === 400) return []
        throw err
      }
    },
    enabled: projectKey != null,
    staleTime: 5 * 60_000,
  })
}

export function useSprints(projectKey: string | null) {
  return useQuery({
    queryKey: ['sprints', projectKey],
    queryFn: () =>
      mockEnabled ? mockListSprints(projectKey!) : listSprints(projectKey!),
    enabled: projectKey != null,
    staleTime: 5 * 60_000,
  })
}

export function useProjectStatuses(projectKey: string | null) {
  return useQuery({
    queryKey: ['statuses', projectKey],
    queryFn: () =>
      mockEnabled
        ? mockListProjectStatuses(projectKey!)
        : listProjectStatuses(projectKey!),
    enabled: projectKey != null,
    staleTime: 5 * 60_000,
  })
}

export function useIssues(filters: Filters) {
  const jql = buildJql(filters)
  return useQuery<IssueSearchResult>({
    queryKey: mockEnabled ? ['issues', filters] : ['issues', jql],
    queryFn: () => (mockEnabled ? mockSearchIssues(filters) : searchIssues(jql!)),
    enabled: jql != null,
    staleTime: 60_000,
  })
}

export function useAssignableUsers(projectKey: string | null, query: string) {
  return useQuery({
    queryKey: ['assignable', projectKey, query],
    queryFn: () =>
      mockEnabled
        ? mockSearchAssignableUsers(projectKey!, query)
        : searchAssignableUsers(projectKey!, query),
    enabled: projectKey != null,
    staleTime: 60_000,
  })
}

export function useAssignMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ issueKey, accountId }: { issueKey: string; accountId: string | null }) =>
      mockEnabled ? mockAssignIssue(issueKey, accountId) : assignIssue(issueKey, accountId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['issues'] })
    },
  })
}
