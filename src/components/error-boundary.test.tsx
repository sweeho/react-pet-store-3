import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppErrorBoundary } from "./error-boundary";

/**
 * UI / COMPONENT TEST
 *
 * Renders a child that throws during render and asserts the caught-error
 * screen (design.md mockup-error-screen.html, AC-4) and a single
 * console.error call (AC-5). `onCaughtError: () => {}` mirrors
 * src/main.tsx's createRoot options, so this test sees exactly the
 * console.error traffic the real app produces — AppErrorBoundary's own
 * componentDidCatch, and nothing from React's own default logging.
 */
function Bomb(): never {
  throw new Error("boom: the customer service is temporarily unavailable");
}

function renderWithBoundary() {
  return render(
    <MemoryRouter initialEntries={["/broken"]}>
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>
    </MemoryRouter>,
    { onCaughtError: () => {} },
  );
}

describe("AppErrorBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the error screen instead of a blank page when a child throws (AC-4)", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderWithBoundary();

    expect(
      screen.getByRole("heading", { level: 1, name: "Something went wrong" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the store" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Sign in again" })).toHaveAttribute("href", "/signin");
    expect(screen.getByText("Technical detail")).toBeInTheDocument();
    expect(
      screen.getByText("boom: the customer service is temporarily unavailable"),
    ).toBeInTheDocument();
  });

  it("logs the caught error to the console exactly once (AC-5)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderWithBoundary();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((spy.mock.calls[0][0] as Error).message).toBe(
      "boom: the customer service is temporarily unavailable",
    );
  });

  it("renders its children normally when nothing throws", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppErrorBoundary>
          <p>All good</p>
        </AppErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByText("All good")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });
});
