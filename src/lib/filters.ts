import type { Filters, StatusMode } from '../types/jira'

export type FilterAction =
  | { type: 'set-project'; projectKey: string | null }
  | { type: 'set-epic'; epicKey: string | null }
  | { type: 'set-sprint'; sprintId: number | null }
  | { type: 'set-status-mode'; mode: Exclude<StatusMode, 'custom'> }
  | { type: 'toggle-status'; name: string }

export const initialFilters: Filters = {
  projectKey: null,
  epicKey: null,
  sprintId: null,
  statusMode: 'not-done',
  statusNames: [],
}

export function filtersReducer(state: Filters, action: FilterAction): Filters {
  switch (action.type) {
    case 'set-project':
      // epic/sprint/custom statuses are project-specific — reset them all
      return { ...initialFilters, projectKey: action.projectKey }
    case 'set-epic':
      return { ...state, epicKey: action.epicKey }
    case 'set-sprint':
      return { ...state, sprintId: action.sprintId }
    case 'set-status-mode':
      return { ...state, statusMode: action.mode, statusNames: [] }
    case 'toggle-status': {
      const statusNames = state.statusNames.includes(action.name)
        ? state.statusNames.filter((n) => n !== action.name)
        : [...state.statusNames, action.name]
      return {
        ...state,
        statusMode: statusNames.length > 0 ? 'custom' : 'not-done',
        statusNames,
      }
    }
  }
}
