import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CommitDecisionsDialog } from "./commit-decisions-dialog";
import type { OrderApprovalRequest } from "@/types/order-approval";

/**
 * UI / COMPONENT TEST
 *
 * Mocks global fetch (same pattern as src/utils/api.test.ts) rather than the
 * admin-orders-api module, so these tests exercise the real
 * commitOrderDecisions call the dialog makes (design.md D11, C11). The
 * dialog never owns staged state (that's useStagedDecisions, SWHR3-T-0038)
 * — "staging kept" on failure is proven by onCommitted never firing, since
 * that is the only signal that would tell a caller to clear it.
 */
const REQUEST: OrderApprovalRequest = {
  requestType: "UPDATESTATUS",
  changes: [
    { orderId: 1001, status: "APPROVED" },
    { orderId: 1002, status: "DENIED" },
    { orderId: 1005, status: "APPROVED" },
  ],
};

const ONE_CHANGE_REQUEST: OrderApprovalRequest = {
  requestType: "UPDATESTATUS",
  changes: [{ orderId: 2001, status: "APPROVED" }],
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("CommitDecisionsDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders nothing when closed", () => {
    render(
      <CommitDecisionsDialog
        open={false}
        request={REQUEST}
        onClose={vi.fn()}
        onCommitted={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lists each staged change as PENDING → STATUS and states all-or-nothing", () => {
    render(
      <CommitDecisionsDialog open request={REQUEST} onClose={vi.fn()} onCommitted={vi.fn()} />,
    );

    expect(screen.getByText(/1001/)).toBeInTheDocument();
    expect(screen.getByText(/1002/)).toBeInTheDocument();
    expect(screen.getByText(/1005/)).toBeInTheDocument();
    expect(screen.getAllByText(/PENDING/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Commit 3 decisions" })).toBeInTheDocument();
  });

  it("cancel closes without sending any request", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const onClose = vi.fn();

    render(
      <CommitDecisionsDialog open request={REQUEST} onClose={onClose} onCommitted={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("[SWHR3-C-0007] commit sends every staged change in exactly one POST and reports the updated count", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { type: "UPDATEORDERS", status: "SUCCESS", updated: 3 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const onCommitted = vi.fn();

    render(
      <CommitDecisionsDialog open request={REQUEST} onClose={vi.fn()} onCommitted={onCommitted} />,
    );
    await user.click(screen.getByRole("button", { name: "Commit 3 decisions" }));

    await waitFor(() => expect(screen.getByText(/3 decisions committed/)).toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/orders/status");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(REQUEST);
    expect(onCommitted).toHaveBeenCalledWith(3);
  });

  it("[SWHR3-C-0020] a non-403 failure shows the server message and keeps staging (onCommitted never fires)", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(409, {
          message: "Order 2001 is COMPLETED and cannot be transitioned",
          data: { code: "INVALID_TRANSITION" },
        }),
      ),
    );
    const onCommitted = vi.fn();

    render(
      <CommitDecisionsDialog
        open
        request={ONE_CHANGE_REQUEST}
        onClose={vi.fn()}
        onCommitted={onCommitted}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Commit 1 decision" }));

    await waitFor(() =>
      expect(
        screen.getByText("Order 2001 is COMPLETED and cannot be transitioned"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Order 2001 is COMPLETED and cannot be transitioned",
    );
    expect(onCommitted).not.toHaveBeenCalled();
  });

  it('a 403 failure always shows "Administrator credentials required" and keeps staging', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(403, {
            message: "Administrator credentials required",
            data: { code: "FORBIDDEN" },
          }),
        ),
    );
    const onCommitted = vi.fn();

    render(
      <CommitDecisionsDialog open request={REQUEST} onClose={vi.fn()} onCommitted={onCommitted} />,
    );
    await user.click(screen.getByRole("button", { name: "Commit 3 decisions" }));

    await waitFor(() =>
      expect(screen.getByText("Administrator credentials required")).toBeInTheDocument(),
    );
    expect(onCommitted).not.toHaveBeenCalled();
  });

  it("closing the failure state calls onClose", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(500, { message: "Internal server error" })),
    );
    const onClose = vi.fn();

    render(
      <CommitDecisionsDialog open request={REQUEST} onClose={onClose} onCommitted={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: "Commit 3 decisions" }));
    await waitFor(() => expect(screen.getByText("Internal server error")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("resets to the confirmation view the next time it is opened with a new request", () => {
    const { rerender } = render(
      <CommitDecisionsDialog
        open={false}
        request={REQUEST}
        onClose={vi.fn()}
        onCommitted={vi.fn()}
      />,
    );

    rerender(
      <CommitDecisionsDialog
        open
        request={ONE_CHANGE_REQUEST}
        onClose={vi.fn()}
        onCommitted={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Commit 1 decision" })).toBeInTheDocument();
  });
});
