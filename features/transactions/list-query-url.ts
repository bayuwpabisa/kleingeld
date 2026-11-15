import { z } from "zod";

import {
  DEFAULT_PAGE_SIZE,
  listQueryFields,
  type TransactionFilters,
  type TransactionListQuery,
} from "@/schemas/transaction";

// The transactions page keeps its search, filters, order and page in the URL,
// with the same names as GET /api/transactions, so a filtered list can be
// bookmarked and shared.

export const DEFAULT_LIST_QUERY: TransactionListQuery = {
  sort: "date",
  order: "desc",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

// URLs are typed and edited by hand: a broken value falls back to its
// default instead of failing the whole page.
const urlSchema = z.object({
  q: listQueryFields.q.catch(undefined),
  type: listQueryFields.type.catch(undefined),
  category: listQueryFields.category.catch(undefined),
  from: listQueryFields.from.catch(undefined),
  to: listQueryFields.to.catch(undefined),
  sort: listQueryFields.sort.catch(DEFAULT_LIST_QUERY.sort),
  order: listQueryFields.order.catch(DEFAULT_LIST_QUERY.order),
  page: listQueryFields.page.catch(DEFAULT_LIST_QUERY.page),
});

type SearchParamsLike = Pick<URLSearchParams, "get">;

/** The list query from the page's URL. The page size is not in the URL. */
export function parseListQuery(params: SearchParamsLike): TransactionListQuery {
  const query = urlSchema.parse({
    q: params.get("q") ?? undefined,
    type: params.get("type") ?? undefined,
    category: params.get("category") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    sort: params.get("sort") ?? undefined,
    order: params.get("order") ?? undefined,
    page: params.get("page") ?? undefined,
  });
  const reversed = query.from && query.to && query.from > query.to;
  return {
    ...query,
    ...(reversed && { from: undefined, to: undefined }),
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

/**
 * The query as URL parameters: only what differs from the default, in a fixed
 * order, so equal lists get equal URLs. Also used for the API requests,
 * where the summary sends the filters alone.
 */
export function toSearchParams(
  query: TransactionFilters &
    Partial<Pick<TransactionListQuery, "sort" | "order" | "page">>,
): URLSearchParams {
  const sort = query.sort ?? DEFAULT_LIST_QUERY.sort;
  const order = query.order ?? DEFAULT_LIST_QUERY.order;
  const page = query.page ?? DEFAULT_LIST_QUERY.page;
  const entries: [string, string | undefined][] = [
    ["q", query.q],
    ["type", query.type],
    ["category", query.category],
    ["from", query.from],
    ["to", query.to],
    ["sort", sort === DEFAULT_LIST_QUERY.sort ? undefined : sort],
    ["order", order === DEFAULT_LIST_QUERY.order ? undefined : order],
    ["page", page === DEFAULT_LIST_QUERY.page ? undefined : String(page)],
  ];
  return new URLSearchParams(
    entries.filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

/** The filters of a list query, for the summary and for matching rows. */
export function filtersOf(query: TransactionFilters): TransactionFilters {
  return {
    q: query.q,
    type: query.type,
    category: query.category,
    from: query.from,
    to: query.to,
  };
}

/** True when the list is narrowed down; sort and page do not count. */
export function hasActiveFilters(query: TransactionFilters): boolean {
  return Object.values(filtersOf(query)).some((value) => value !== undefined);
}
