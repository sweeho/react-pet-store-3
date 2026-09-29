import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Dialog, DialogDescription, DialogFooter, DialogPanel, DialogTitle } from "./dialog";

/**
 * UI / COMPONENT TEST
 */
function ConfirmDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogPanel>
        <DialogTitle>Discard 3 uncommitted changes?</DialogTitle>
        <DialogDescription>Refreshing now throws away every staged decision.</DialogDescription>
        <DialogFooter>
          <button type="button" onClick={onClose}>
            Cancel — keep my changes
          </button>
          <button type="button">Refresh anyway</button>
        </DialogFooter>
      </DialogPanel>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("renders its content when open", () => {
    render(<ConfirmDialog open onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Discard 3 uncommitted changes?")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(<ConfirmDialog open={false} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ConfirmDialog open onClose={onClose} />);

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });

  it("traps focus inside the panel: tabbing from the last control returns to the first", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog open onClose={vi.fn()} />);

    const cancelButton = screen.getByRole("button", { name: "Cancel — keep my changes" });
    const refreshButton = screen.getByRole("button", { name: "Refresh anyway" });

    await waitFor(() => expect(document.activeElement).not.toBe(document.body));

    refreshButton.focus();
    await user.tab();

    expect(document.activeElement).toBe(cancelButton);
  });
});
