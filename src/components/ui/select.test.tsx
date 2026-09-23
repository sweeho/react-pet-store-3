import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Select } from "./select";

/**
 * UI / COMPONENT TEST
 */
describe("Select", () => {
  it("renders a native select styled like Input, with its options", () => {
    render(
      <Select aria-label="State / Province" defaultValue="">
        <option value="" disabled>
          Select a state
        </option>
        <option value="CA">California</option>
      </Select>,
    );

    const select = screen.getByRole("combobox", { name: "State / Province" });
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "California" })).toBeInTheDocument();
  });

  it("fires onChange when a new option is chosen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select aria-label="State / Province" onChange={onChange}>
        <option value="CA">California</option>
        <option value="NY">New York</option>
      </Select>,
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "State / Province" }), "NY");

    expect(onChange).toHaveBeenCalled();
    expect(screen.getByRole("combobox", { name: "State / Province" })).toHaveValue("NY");
  });

  it("forwards a ref to the underlying <select>", () => {
    const ref = { current: null as HTMLSelectElement | null };
    render(
      <Select ref={ref} aria-label="State / Province">
        <option value="CA">California</option>
      </Select>,
    );

    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });
});
