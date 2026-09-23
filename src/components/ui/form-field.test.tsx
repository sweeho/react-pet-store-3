import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormField } from "./form-field";
import { Input } from "./input";

/**
 * UI / COMPONENT TEST
 *
 * Covers the interface contract: FormField links its error text to the
 * control through aria-invalid and aria-describedby (AC-1), and shows the
 * given error text beneath the control without losing the control's current
 * value (AC-5).
 */
describe("FormField", () => {
  it("renders the label and links helper text via aria-describedby", () => {
    render(
      <FormField label="User name" helperText="3-25 characters">
        <Input />
      </FormField>,
    );

    const input = screen.getByLabelText("User name");
    expect(screen.getByText("3-25 characters")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-describedby", expect.stringContaining(input.id));
    expect(input.getAttribute("aria-describedby")).toBe(screen.getByText("3-25 characters").id);
  });

  it("shows the given error text beneath the control and marks it aria-invalid", () => {
    render(
      <FormField label="User name" error="User name is required">
        <Input value="jgarrett" onChange={() => {}} />
      </FormField>,
    );

    const input = screen.getByLabelText("User name");
    const error = screen.getByText("User name is required");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", error.id);
    expect(input).toHaveValue("jgarrett");
  });

  it("keeps the control's current value when an error appears on rerender", () => {
    const { rerender } = render(
      <FormField label="User name">
        <Input value="jgarrett" onChange={() => {}} />
      </FormField>,
    );

    expect(screen.getByLabelText("User name")).toHaveValue("jgarrett");

    rerender(
      <FormField label="User name" error="That user name is taken">
        <Input value="jgarrett" onChange={() => {}} />
      </FormField>,
    );

    expect(screen.getByLabelText("User name")).toHaveValue("jgarrett");
    expect(screen.getByLabelText("User name")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not mark the control invalid when there is no error", () => {
    render(
      <FormField label="User name">
        <Input />
      </FormField>,
    );

    expect(screen.getByLabelText("User name")).toHaveAttribute("aria-invalid", "false");
  });
});
