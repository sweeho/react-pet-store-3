import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useStagedDecisions } from "./use-staged-decisions";

/**
 * HOOK TEST
 *
 * Exercises useStagedDecisions directly (design.md C10, D8) — the hook is
 * the state model OrdersTable (SWHR3-T-0037) stages against, so "tick a
 * checkbox and click Approve" is exercised here as a direct stage() call.
 */
describe("useStagedDecisions", () => {
  it("[SWHR3-C-0004] staging one order as APPROVED leaves the others untouched", () => {
    const { result } = renderHook(() => useStagedDecisions());

    act(() => {
      result.current.stage([1001], "APPROVED");
    });

    expect(result.current.staged.get(1001)).toBe("APPROVED");
    expect(result.current.staged.has(1002)).toBe(false);
    expect(result.current.staged.has(1003)).toBe(false);
    expect(result.current.count).toBe(1);
  });

  it("[SWHR3-C-0006] staging several selected orders as DENIED stages each one", () => {
    const { result } = renderHook(() => useStagedDecisions());

    act(() => {
      result.current.stage([1001, 1002, 1004], "DENIED");
    });

    expect(result.current.staged.get(1001)).toBe("DENIED");
    expect(result.current.staged.get(1002)).toBe("DENIED");
    expect(result.current.staged.get(1004)).toBe("DENIED");
    expect(result.current.staged.has(1003)).toBe(false);
    expect(result.current.count).toBe(3);
  });

  it("[SWHR3-C-0008] toRequest serializes each staged change as orderId and status, ascending", () => {
    const { result } = renderHook(() => useStagedDecisions());

    act(() => {
      result.current.stage([1002], "DENIED");
    });
    act(() => {
      result.current.stage([1001], "APPROVED");
    });

    expect(result.current.toRequest()).toEqual({
      requestType: "UPDATESTATUS",
      changes: [
        { orderId: 1001, status: "APPROVED" },
        { orderId: 1002, status: "DENIED" },
      ],
    });
  });

  it("[SWHR3-C-0017] toRequest carries requestType UPDATESTATUS and one entry per changed order", () => {
    const { result } = renderHook(() => useStagedDecisions());

    act(() => {
      result.current.stage([1001, 1002], "APPROVED");
      result.current.stage([1003], "DENIED");
    });

    const request = result.current.toRequest();

    expect(request.requestType).toBe("UPDATESTATUS");
    expect(request.changes).toHaveLength(3);
    for (const change of request.changes) {
      expect(Object.keys(change).sort()).toEqual(["orderId", "status"]);
    }
  });

  it("staging an already-staged order replaces its status rather than adding a second entry", () => {
    const { result } = renderHook(() => useStagedDecisions());

    act(() => {
      result.current.stage([1001], "APPROVED");
    });
    act(() => {
      result.current.stage([1001], "DENIED");
    });

    expect(result.current.count).toBe(1);
    expect(result.current.staged.get(1001)).toBe("DENIED");
    expect(result.current.toRequest().changes).toEqual([{ orderId: 1001, status: "DENIED" }]);
  });

  it("unstage removes a single order's staged decision", () => {
    const { result } = renderHook(() => useStagedDecisions());

    act(() => {
      result.current.stage([1001, 1002], "APPROVED");
    });
    act(() => {
      result.current.unstage(1001);
    });

    expect(result.current.staged.has(1001)).toBe(false);
    expect(result.current.staged.get(1002)).toBe("APPROVED");
    expect(result.current.count).toBe(1);
  });

  it("clear removes every staged decision", () => {
    const { result } = renderHook(() => useStagedDecisions());

    act(() => {
      result.current.stage([1001, 1002, 1003], "DENIED");
    });
    act(() => {
      result.current.clear();
    });

    expect(result.current.count).toBe(0);
    expect(result.current.staged.size).toBe(0);
  });

  it("hasUncommittedChanges is false with nothing staged", () => {
    const { result } = renderHook(() => useStagedDecisions());

    expect(result.current.hasUncommittedChanges).toBe(false);
  });

  it("hasUncommittedChanges is true once an order is staged", () => {
    const { result } = renderHook(() => useStagedDecisions());

    act(() => {
      result.current.stage([1001], "APPROVED");
    });

    expect(result.current.hasUncommittedChanges).toBe(true);
  });

  it("hasUncommittedChanges becomes false after clear()", () => {
    const { result } = renderHook(() => useStagedDecisions());

    act(() => {
      result.current.stage([1001], "APPROVED");
    });
    act(() => {
      result.current.clear();
    });

    expect(result.current.hasUncommittedChanges).toBe(false);
  });

  it("hasUncommittedChanges becomes false after unstaging the last order", () => {
    const { result } = renderHook(() => useStagedDecisions());

    act(() => {
      result.current.stage([1001], "APPROVED");
    });
    act(() => {
      result.current.unstage(1001);
    });

    expect(result.current.hasUncommittedChanges).toBe(false);
  });
});
