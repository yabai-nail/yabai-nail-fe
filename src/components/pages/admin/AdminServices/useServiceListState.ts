import { useState } from "react";
import { hasColumnFilters, NO_COLUMN_FILTERS, type ServiceListView } from "./data";

export type ServiceListState = ServiceListView & {
  readonly setQuery: (query: ServiceListView["query"]) => void;
  readonly setFilters: (filters: ServiceListView["filters"]) => void;
  readonly setSort: (sort: ServiceListView["sort"]) => void;
  readonly setPage: (page: number) => void;
  /** Whether a search or column filter is narrowing the list. */
  readonly isFiltered: boolean;
  readonly clear: () => void;
};

/**
 * The search, column filters, sort and page of one tab's list. Each tab holds its own, so
 * switching tabs never carries a category filter onto rows that have no category. Any change
 * to what is listed goes back to the first page.
 */
export function useServiceListState(): ServiceListState {
  const [view, setView] = useState<ServiceListView>({ query: "", filters: NO_COLUMN_FILTERS, sort: null, page: 1 });
  const change = (patch: Partial<ServiceListView>) => setView((current) => ({ ...current, page: 1, ...patch }));
  return {
    ...view,
    setQuery: (query) => change({ query }),
    setFilters: (filters) => change({ filters }),
    setSort: (sort) => change({ sort }),
    setPage: (page) => change({ page }),
    isFiltered: view.query.trim() !== "" || hasColumnFilters(view.filters),
    clear: () => change({ query: "", filters: NO_COLUMN_FILTERS }),
  };
}
