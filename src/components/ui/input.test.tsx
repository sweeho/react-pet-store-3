import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Input } from "./input";

/**
 * UI / COMPONENT TEST
 *
 * Copy of the button.test.tsx pattern for a form primitive: render into
 * jsdom, interact via user-event, assert on visible DOM state.
 */
describe("Input", () => {
  it("renders a text input with the default variant classes", () => {
    render(<Input placeholder="User name" />);

    const input = screen.getByPlaceholderText("User name");
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("border-input");
  });

  it("applies the error variant classes", () => {
    render(<Input placeholder="User name" variant="error" />);

    expect(screen.getByPlaceholderText("User name")).toHaveClass("border-destructive");
  });

  it("accepts typed input and fires onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input placeholder="User name" onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("User name"), "abc");

    expect(onChange).toHaveBeenCalled();
    expect(screen.getByPlaceholderText("User name")).toHaveValue("abc");
  });

  it("forwards a ref to the underlying <input>", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} placeholder="User name" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
