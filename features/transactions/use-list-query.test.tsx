import { act, renderHook } from "@testing-library/react";

import { setUrl } from "@/test/url-navigation";

import { useListQuery } from "./use-list-query";

jest.mock("next/navigation", () => jest.requireActual("@/test/url-navigation"));

const CATEGORY = "3f1c2b4e-8a7d-4c5e-9f60-1a2b3c4d5e6f";

function setup(url: string) {
  setUrl(url);
  return renderHook(() => useListQuery());
}

describe("useListQuery", () => {
  it("reads the list query from the URL", () => {
    const { result } = setup("/transactions?q=kopi&sort=amount&page=2");
    expect(result.current.query).toMatchObject({
      q: "kopi",
      sort: "amount",
      order: "desc",
      page: 2,
      pageSize: 20,
    });
  });

  it("changes a filter, goes back to page 1 and adds a history entry", () => {
    const { result } = setup("/transactions?q=kopi&page=3");
    const before = window.history.length;

    act(() => result.current.setFilters({ type: "expense" }));

    expect(window.location.search).toBe("?q=kopi&type=expense");
    expect(window.history.length).toBe(before + 1);
    expect(result.current.query).toMatchObject({ type: "expense", page: 1 });
  });

  it("replaces the history entry while typing a search", () => {
    const { result } = setup("/transactions");
    const before = window.history.length;

    act(() => result.current.setFilters({ q: "kopi" }, { replace: true }));

    expect(window.location.search).toBe("?q=kopi");
    expect(window.history.length).toBe(before);
  });

  it("removes a filter that is set to undefined", () => {
    const { result } = setup(`/transactions?category=${CATEGORY}&type=expense`);

    act(() => result.current.setFilters({ category: undefined }));

    expect(window.location.search).toBe("?type=expense");
  });

  it("sorts from page 1", () => {
    const { result } = setup("/transactions?page=4");

    act(() => result.current.setSort({ sort: "amount", order: "asc" }));

    expect(window.location.search).toBe("?sort=amount&order=asc");
  });

  it("goes to a page, and can replace the entry for a page that is gone", () => {
    const { result } = setup("/transactions?type=income");
    const before = window.history.length;

    act(() => result.current.setPage(2));
    expect(window.location.search).toBe("?type=income&page=2");
    expect(window.history.length).toBe(before + 1);

    act(() => result.current.setPage(1, { replace: true }));
    expect(window.location.search).toBe("?type=income");
    expect(window.history.length).toBe(before + 1);
  });

  it("clears the filters but keeps the order", () => {
    const { result } = setup(
      "/transactions?q=kopi&from=2026-11-01&to=2026-11-30&sort=amount&page=2",
    );

    act(() => result.current.clearFilters());

    expect(window.location.pathname).toBe("/transactions");
    expect(window.location.search).toBe("?sort=amount");
  });
});
