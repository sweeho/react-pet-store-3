import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "./input";
import { Label } from "./label";

/**
 * UI / COMPONENT TEST
 */
describe("Label", () => {
  it("renders its text and links to a control via htmlFor", () => {
    render(
      <>
        <Label htmlFor="username">User name</Label>
        <Input id="username" />
      </>,
    );

    const input = screen.getByLabelText("User name");
    expect(input).toBeInTheDocument();
  });

  it("merges a custom className with the base styles", () => {
    render(<Label className="custom-class">User name</Label>);

    const label = screen.getByText("User name");
    expect(label).toHaveClass("custom-class");
    expect(label).toHaveClass("text-sm");
  });
});
