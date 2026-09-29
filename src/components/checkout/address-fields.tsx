/**
 * One numbered address section of the checkout form (design.md C2, C4, D13),
 * built from CONTACT_INFO_FIELDS. Inputs are named `<param><suffix>` (`_a`
 * billing, `_b` shipping) and controlled by the page, so "Same as billing
 * address" can mirror one section into the other. Layout follows
 * mockup-checkout-enter-order-information.html.
 */
import { FormField, Input } from "@/components/ui";
import { CONTACT_INFO_FIELDS, type ContactInfo, type ContactInfoField } from "@/types/checkout";

export type AddressValues = Record<keyof ContactInfo, string>;

export interface AddressFieldsProps {
  step: number;
  title: string;
  hint?: string;
  suffix: "_a" | "_b";
  values: AddressValues;
  onChange: (key: keyof ContactInfo, value: string) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
  /** Rendered above the fields, inside the card. */
  before?: React.ReactNode;
  /** Rendered below the fields, inside the card. */
  after?: React.ReactNode;
}

// The mockup's rows, and how many columns each has on wide screens.
const ROWS: Array<{ keys: Array<keyof ContactInfo>; columns: string }> = [
  { keys: ["givenName", "familyName"], columns: "sm:grid-cols-2" },
  { keys: ["address1", "address2"], columns: "sm:grid-cols-2" },
  { keys: ["city", "stateOrProvince", "postalCode"], columns: "sm:grid-cols-3" },
  { keys: ["country", "telephoneNumber", "email"], columns: "sm:grid-cols-3" },
];

const FIELDS_BY_KEY = new Map<keyof ContactInfo, ContactInfoField>(
  CONTACT_INFO_FIELDS.map((field) => [field.key, field]),
);

const INPUT_TYPES: Partial<Record<keyof ContactInfo, string>> = {
  email: "email",
  telephoneNumber: "tel",
};

const AUTOCOMPLETE: Partial<Record<keyof ContactInfo, string>> = {
  givenName: "given-name",
  familyName: "family-name",
  address1: "address-line1",
  address2: "address-line2",
  postalCode: "postal-code",
  email: "email",
  telephoneNumber: "tel",
};

export function AddressFields({
  step,
  title,
  hint,
  suffix,
  values,
  onChange,
  disabled = false,
  errors = {},
  before,
  after,
}: AddressFieldsProps): React.ReactElement {
  const headingId = `address-section${suffix}-title`;

  return (
    <section
      aria-labelledby={headingId}
      className="border-border bg-card rounded-lg border shadow-sm"
    >
      <div className="border-border flex items-center gap-3 border-b px-6 py-4">
        <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
          {step}
        </span>
        <h2 id={headingId} className="text-base font-semibold">
          {title}
        </h2>
        {hint && <span className="text-muted-foreground ml-auto text-xs">{hint}</span>}
      </div>
      <div className="px-6 py-5">
        {before}
        {ROWS.map((row) => (
          <div key={row.keys.join("-")} className={`grid gap-x-4 ${row.columns}`}>
            {row.keys.map((key) => {
              const field = FIELDS_BY_KEY.get(key);
              if (!field) {
                return null;
              }
              const name = `${field.param}${suffix}`;
              return (
                <FormField
                  key={key}
                  error={errors[name]}
                  label={
                    <>
                      {field.label}
                      {!field.required && (
                        <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                          Optional
                        </span>
                      )}
                    </>
                  }
                >
                  <Input
                    name={name}
                    type={INPUT_TYPES[key] ?? "text"}
                    autoComplete={AUTOCOMPLETE[key]}
                    value={values[key]}
                    onChange={(event) => onChange(key, event.target.value)}
                    disabled={disabled}
                    required={field.required}
                    aria-required={field.required}
                  />
                </FormField>
              );
            })}
          </div>
        ))}
        {after}
      </div>
    </section>
  );
}
