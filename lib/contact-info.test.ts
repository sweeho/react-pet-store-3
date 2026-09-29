import { describe, expect, it } from "vitest";

import { CONTACT_INFO_FIELDS } from "./contact-info";

/**
 * UNIT TEST (server project). design.md C2: the ordered field table the
 * parser, the entity writer and the form all read.
 */
describe("CONTACT_INFO_FIELDS", () => {
  it("[SWHR3-C-0137] lists the ten ContactInfo keys in order, only address2 optional", () => {
    expect(CONTACT_INFO_FIELDS.map((f) => f.key)).toEqual([
      "familyName",
      "givenName",
      "address1",
      "address2",
      "city",
      "stateOrProvince",
      "postalCode",
      "country",
      "telephoneNumber",
      "email",
    ]);
    expect(CONTACT_INFO_FIELDS.filter((f) => !f.required).map((f) => f.key)).toEqual(["address2"]);
  });

  it("[SWHR3-C-0137] request params match the checkout form (C4) and labels the mockup", () => {
    expect(CONTACT_INFO_FIELDS.map((f) => f.param)).toEqual([
      "family_name",
      "given_name",
      "address_1",
      "address_2",
      "city",
      "state_or_province",
      "postal_code",
      "country",
      "telephone_number",
      "email",
    ]);
    expect(CONTACT_INFO_FIELDS.map((f) => f.label)).toEqual([
      "Family name",
      "Given name",
      "Address line 1",
      "Address line 2",
      "City",
      "State or province",
      "Postal code",
      "Country",
      "Telephone",
      "Email",
    ]);
  });
});
