import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "./checkbox";

/**
 * UI / COMPONENT TEST
 */
describe("Checkbox", () => {
  it("renders a native checkbox with its label and helper text", () => {
    render(
      <Checkbox
        label="Remember my user name"
        helperText="Fills this field in for you next time on this browser."
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Remember my user name" });
    expect(checkbox).toBeInTheDocument();
    expect(
      screen.getByText("Fills this field in for you next time on this browser."),
    ).toBeInTheDocument();
  });

  it("toggles when clicked and fires onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Remember my user name" onChange={onChange} />);

    const checkbox = screen.getByRole("checkbox", { name: "Remember my user name" });
    await user.click(checkbox);

    expect(onChange).toHaveBeenCalled();
  });

  it("reflects a controlled checked state", () => {
    render(<Checkbox label="Remember my user name" checked readOnly />);

    expect(screen.getByRole("checkbox", { name: "Remember my user name" })).toBeChecked();
  });
});
