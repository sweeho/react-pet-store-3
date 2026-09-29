import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./badge";

/**
 * UI / COMPONENT TEST
 */
describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge variant="approved">APPROVED</Badge>);

    expect(screen.getByText("APPROVED")).toBeInTheDocument();
  });

  it.each([
    ["pending", "PENDING"],
    ["approved", "APPROVED"],
    ["denied", "DENIED"],
    ["completed", "COMPLETED"],
    ["staged", "STAGED"],
  ] as const)("applies the %s variant's classes", (variant, label) => {
    render(<Badge variant={variant}>{label}</Badge>);

    const badge = screen.getByText(label);
    expect(badge.className.length).toBeGreaterThan(0);
  });

  it("merges a caller's className with its own", () => {
    render(
      <Badge variant="denied" className="extra-class">
        DENIED
      </Badge>,
    );

    expect(screen.getByText("DENIED")).toHaveClass("extra-class");
  });
});
