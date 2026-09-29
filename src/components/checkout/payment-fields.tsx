import { FormField, Input, Select } from "@/components/ui";
import { CHECKOUT_CARD_TYPES as CARD_TYPES } from "@/types/checkout";

const YEARS_AHEAD = 5;

export interface PaymentFieldsProps {
  errors?: Record<string, string>;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

/** The "3 Payment" section of the checkout form (design.md C4). */
export function PaymentFields({ errors = {} }: PaymentFieldsProps): React.ReactElement {
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: YEARS_AHEAD + 1 }, (_, i) => String(thisYear + i));

  return (
    <section className="border-border bg-card rounded-lg border shadow-sm">
      <div className="border-border flex items-center gap-3 border-b px-6 py-4">
        <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
          3
        </span>
        <h2 className="text-base font-semibold">Payment</h2>
      </div>
      <div className="px-6 py-5">
        <div className="grid gap-x-4 sm:grid-cols-2">
          <FormField label="Card type" error={errors.credit_card_type}>
            <Select name="credit_card_type" required aria-required>
              {CARD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Card number" error={errors.credit_card_number}>
            <Input
              name="credit_card_number"
              inputMode="numeric"
              autoComplete="cc-number"
              required
              aria-required
            />
          </FormField>
          <FormField label="Expiry month" error={errors.expiration_month}>
            <Select name="expiration_month" required aria-required>
              {MONTHS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Expiry year" error={errors.expiration_year}>
            <Select name="expiration_year" required aria-required>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <p className="text-muted-foreground text-xs">
          Your card is saved with the order and shown back to you on the confirmation. No payment is
          taken and no card is charged.
        </p>
      </div>
    </section>
  );
}
