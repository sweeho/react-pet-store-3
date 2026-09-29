import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CONTACT_INFO_FIELDS } from "@/types/checkout";
import { AddressFields, type AddressValues } from "./address-fields";

/**
 * UI / COMPONENT TEST. design.md C2, C4, D13: one numbered address section
 * built from CONTACT_INFO_FIELDS, inputs named `<param><suffix>`.
 */
const EMPTY: AddressValues = {
  familyName: "",
  givenName: "",
  address1: "",
  address2: "",
  city: "",
  stateOrProvince: "",
  postalCode: "",
  country: "",
  telephoneNumber: "",
  email: "",
};

function renderSection(props: Partial<React.ComponentProps<typeof AddressFields>> = {}) {
  return render(
    <AddressFields
      step={1}
      title="Billing address"
      suffix="_a"
      values={EMPTY}
      onChange={() => undefined}
      {...props}
    />,
  );
}

describe("AddressFields", () => {
  it("is a named section with its step number and title", () => {
    renderSection({ hint: "Pre-filled from your account" });

    const section = screen.getByRole("region", { name: "Billing address" });
    expect(within(section).getByText("1")).toBeInTheDocument();
    expect(within(section).getByText("Pre-filled from your account")).toBeInTheDocument();
  });

  it.each(["_a", "_b"] as const)("names every input with the %s suffix", (suffix) => {
    renderSection({ suffix });

    for (const field of CONTACT_INFO_FIELDS) {
      const input = screen.getByLabelText(new RegExp(`^${field.label}`));
      expect(input).toHaveAttribute("name", `${field.param}${suffix}`);
    }
  });

  it("shows fields in the mockup's order: given before family name", () => {
    renderSection();

    const names = screen.getAllByRole("textbox").map((el) => el.getAttribute("name"));
    expect(names.slice(0, 2)).toEqual(["given_name_a", "family_name_a"]);
  });

  it("marks only Address line 2 as Optional and the rest required", () => {
    renderSection();

    expect(screen.getByLabelText(/^Address line 2/)).not.toBeRequired();
    expect(screen.getByText("Optional")).toBeInTheDocument();
    for (const field of CONTACT_INFO_FIELDS.filter((f) => f.required)) {
      const input = screen.getByLabelText(new RegExp(`^${field.label}`));
      expect(input).toBeRequired();
      expect(input).toHaveAttribute("aria-required", "true");
    }
  });

  it("shows the given values and reports edits through onChange", async () => {
    const onChange = vi.fn();
    renderSection({ values: { ...EMPTY, city: "Palo Alto" }, onChange });

    expect(screen.getByLabelText("City")).toHaveValue("Palo Alto");
    await userEvent.type(screen.getByLabelText("Postal code"), "9");
    expect(onChange).toHaveBeenCalledWith("postalCode", "9");
  });

  it("disables every input when disabled", () => {
    renderSection({ disabled: true });

    for (const input of screen.getAllByRole("textbox")) {
      expect(input).toBeDisabled();
    }
  });

  it("shows a field's error message beside it", () => {
    renderSection({ errors: { city_a: "Enter a city." } });

    expect(screen.getByLabelText("City")).toHaveAccessibleDescription("Enter a city.");
    expect(screen.getByLabelText("City")).toBeInvalid();
  });

  it("renders before and after slots", () => {
    renderSection({ before: <p>above</p>, after: <p>below</p> });

    expect(screen.getByText("above")).toBeInTheDocument();
    expect(screen.getByText("below")).toBeInTheDocument();
  });
});
