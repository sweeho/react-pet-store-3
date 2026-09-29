import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RefreshOrdersControl } from "./refresh-orders-control";
import type { AssignableStatus } from "@/constants/order-status";

/**
 * UI / COMPONENT TEST
 *
 * Exercises RefreshOrdersControl in isolation (design.md D11, D8, SD7, C12)
 * — the mockup (artifacts/SWHR3-S-0003/design/mockup-uncommitted-changes-
 * warning-on-refresh.html) sets the dialog's layout; its exact copy is
 * overridden by design.md D11, which PLAN.md quotes verbatim ("Discard N
 * uncommitted changes?", "Cancel — keep my changes", "Refresh anyway").
 */
function staged(entries: Array<[number, AssignableStatus]>): ReadonlyMap<number, AssignableStatus> {
  return new Map(entries);
}

describe("RefreshOrdersControl", () => {
  it("[SWHR3-C-0010] reloads immediately and never opens the dialog when nothing is staged", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const onDiscard = vi.fn();

    render(
      <RefreshOrdersControl staged={staged([])} onRefresh={onRefresh} onDiscard={onDiscard} />,
    );

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it("[SWHR3-C-0009] opens a dialog naming the staged count and listing each change as id → status, without refreshing", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const onDiscard = vi.fn();

    render(
      <RefreshOrdersControl
        staged={staged([[1001, "APPROVED"]])}
        onRefresh={onRefresh}
        onDiscard={onDiscard}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Discard 1 uncommitted changes?");
    expect(dialog).toHaveTextContent("1001");
    expect(dialog).toHaveTextContent("APPROVED");
    expect(onRefresh).not.toHaveBeenCalled();
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it("names every staged change in the dialog body (AC-5)", async () => {
    const user = userEvent.setup();

    render(
      <RefreshOrdersControl
        staged={staged([
          [1001, "APPROVED"],
          [1003, "DENIED"],
        ])}
        onRefresh={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Discard 2 uncommitted changes?");
    expect(dialog).toHaveTextContent("1001");
    expect(dialog).toHaveTextContent("APPROVED");
    expect(dialog).toHaveTextContent("1003");
    expect(dialog).toHaveTextContent("DENIED");
  });

  it("'Cancel — keep my changes' closes the dialog without discarding or refreshing", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const onDiscard = vi.fn();

    render(
      <RefreshOrdersControl
        staged={staged([[1001, "APPROVED"]])}
        onRefresh={onRefresh}
        onDiscard={onDiscard}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Refresh" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel — keep my changes" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onDiscard).not.toHaveBeenCalled();
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("'Refresh anyway' discards then refreshes and closes the dialog", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const onDiscard = vi.fn();

    render(
      <RefreshOrdersControl
        staged={staged([[1001, "APPROVED"]])}
        onRefresh={onRefresh}
        onDiscard={onDiscard}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Refresh" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Refresh anyway" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
