export interface ContactInfo {
  familyName: string;
  givenName: string;
  address1: string;
  address2: string | null;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
  telephoneNumber: string;
  email: string;
}

export interface ContactInfoField {
  key: keyof ContactInfo;
  param: string;
  label: string;
  required: boolean;
}

/** Ordered as the checkout form shows them (design.md C2). */
export const CONTACT_INFO_FIELDS: readonly ContactInfoField[] = [
  { key: "familyName", param: "family_name", label: "Family name", required: true },
  { key: "givenName", param: "given_name", label: "Given name", required: true },
  { key: "address1", param: "address_1", label: "Address line 1", required: true },
  { key: "address2", param: "address_2", label: "Address line 2", required: false },
  { key: "city", param: "city", label: "City", required: true },
  {
    key: "stateOrProvince",
    param: "state_or_province",
    label: "State or province",
    required: true,
  },
  { key: "postalCode", param: "postal_code", label: "Postal code", required: true },
  { key: "country", param: "country", label: "Country", required: true },
  { key: "telephoneNumber", param: "telephone_number", label: "Telephone", required: true },
  { key: "email", param: "email", label: "Email", required: true },
];
