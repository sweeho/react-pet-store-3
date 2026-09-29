import { describe, expect, it } from "vitest";

import { FieldErrorCollector, extractContactInfo } from "./checkout-request";

/**
 * UNIT TEST (server project). design.md C4/C6, D2: one address read from
 * the flat request, trimmed, recording every problem without throwing.
 */
type Suffix = "_a" | "_b";

function fullSet(suffix: Suffix, overrides: Record<string, string> = {}): Record<string, string> {
  const base: Record<string, string> = {
    family_name: "Chen",
    given_name: "Sarah",
    address_1: "1247 Larkspur Avenue",
    city: "Palo Alto",
    state_or_province: "CA",
    postal_code: "94301",
    country: "United States",
    telephone_number: "+1 650 555 0134",
    email: "sarah.chen@example.com",
    ...overrides,
  };
  return Object.fromEntries(Object.entries(base).map(([k, v]) => [`${k}${suffix}`, v]));
}

const EXPECTED = {
  familyName: "Chen",
  givenName: "Sarah",
  address1: "1247 Larkspur Avenue",
  address2: null,
  city: "Palo Alto",
  stateOrProvince: "CA",
  postalCode: "94301",
  country: "United States",
  telephoneNumber: "+1 650 555 0134",
  email: "sarah.chen@example.com",
};

describe.each<Suffix>(["_a", "_b"])("extractContactInfo with suffix %s", (suffix) => {
  it("[SWHR3-C-0098] [SWHR3-C-0104] a complete address is accepted with every field", () => {
    const errors = new FieldErrorCollector();

    expect(extractContactInfo(fullSet(suffix), suffix, errors)).toEqual(EXPECTED);
    expect(errors.fieldErrors).toEqual({});
    expect(errors.missingFields).toEqual([]);
  });

  it("[SWHR3-C-0100] a blank or absent address line 2 is null and no error", () => {
    for (const extra of [{}, { [`address_2${suffix}`]: "   " }]) {
      const errors = new FieldErrorCollector();
      const info = extractContactInfo({ ...fullSet(suffix), ...extra }, suffix, errors);
      expect(info?.address2).toBeNull();
      expect(errors.fieldErrors).toEqual({});
    }
  });

  it("[SWHR3-C-0100] a given address line 2 is kept", () => {
    const errors = new FieldErrorCollector();
    const info = extractContactInfo(
      { ...fullSet(suffix), [`address_2${suffix}`]: " Apt 4 " },
      suffix,
      errors,
    );
    expect(info?.address2).toBe("Apt 4");
  });

  it("[SWHR3-C-0129] a whitespace-only required field is missing with its own message", () => {
    const errors = new FieldErrorCollector();
    const info = extractContactInfo(
      fullSet(suffix, { postal_code: "   ", city: "  Palo Alto  " }),
      suffix,
      errors,
    );

    expect(info).toBeNull();
    expect(errors.missingFields).toEqual([`postal_code${suffix}`]);
    expect(errors.fieldErrors[`postal_code${suffix}`]).toMatch(/^Spaces only/);
    expect(errors.fieldErrors).not.toHaveProperty(`city${suffix}`);
  });

  it("[SWHR3-C-0104] an empty required field records an Enter-a message", () => {
    const errors = new FieldErrorCollector();
    const info = extractContactInfo(fullSet(suffix, { telephone_number: "" }), suffix, errors);

    expect(info).toBeNull();
    expect(errors.fieldErrors[`telephone_number${suffix}`]).toBe("Enter a telephone.");
    expect(errors.missingFields).toEqual([`telephone_number${suffix}`]);
  });

  it("several blanks are all recorded in field order", () => {
    const errors = new FieldErrorCollector();
    const fields = fullSet(suffix, { email: "", family_name: "", city: " " });
    delete fields[`country${suffix}`];

    expect(extractContactInfo(fields, suffix, errors)).toBeNull();
    expect(errors.missingFields).toEqual([
      `family_name${suffix}`,
      `city${suffix}`,
      `country${suffix}`,
      `email${suffix}`,
    ]);
  });

  it("an invalid email is recorded as an error", () => {
    const errors = new FieldErrorCollector();
    expect(extractContactInfo(fullSet(suffix, { email: "nope" }), suffix, errors)).toBeNull();
    expect(errors.fieldErrors).toHaveProperty(`email${suffix}`);
  });

  it("a non-string value counts as missing", () => {
    const errors = new FieldErrorCollector();
    const fields: Record<string, unknown> = { ...fullSet(suffix), [`city${suffix}`]: 5 };
    expect(extractContactInfo(fields, suffix, errors)).toBeNull();
    expect(errors.missingFields).toEqual([`city${suffix}`]);
  });

  it("[SWHR3-C-0130] surrounding spaces are trimmed from stored values", () => {
    const padded = Object.fromEntries(
      Object.entries(fullSet(suffix)).map(([k, v]) => [k, `  ${v}  `]),
    );
    const errors = new FieldErrorCollector();

    expect(extractContactInfo(padded, suffix, errors)).toEqual(EXPECTED);
  });
});

describe("extractContactInfo suffix isolation", () => {
  const both = {
    ...fullSet("_a"),
    ...fullSet("_b", { family_name: "Okafor", city: "Austin", email: "b@example.com" }),
  };

  it("[SWHR3-C-0133] billing is read only from _a fields", () => {
    const info = extractContactInfo(both, "_a", new FieldErrorCollector());
    expect(info?.familyName).toBe("Chen");
    expect(info?.city).toBe("Palo Alto");
    expect(info?.email).toBe("sarah.chen@example.com");
  });

  it("[SWHR3-C-0134] shipping is read only from _b fields", () => {
    const info = extractContactInfo(both, "_b", new FieldErrorCollector());
    expect(info?.familyName).toBe("Okafor");
    expect(info?.city).toBe("Austin");
    expect(info?.email).toBe("b@example.com");
  });
});
