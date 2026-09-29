/**
 * The checkout page's refusal states (design.md D9, D13, SD7). CheckoutErrors
 * is the "Your order was not placed" summary of mockup-checkout-missing-
 * required-fields.html; EmptyCartState is mockup-checkout-blocked-shopping-
 * cart-is-empty.html. Main content only (SD12).
 */
import * as React from "react";
import { Link } from "react-router";

import { Alert, AlertDescription } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button-variants";
import { CART_PATH, EMPTY_CART_CHECKOUT_MESSAGE } from "@/constants/cart";
import { CONTACT_INFO_FIELDS } from "@/types/checkout";
import { cn } from "@/utils";

const PAYMENT_LABELS: Record<string, string> = {
  credit_card_type: "Card type",
  credit_card_number: "Card number",
  expiration_month: "Expiry month",
  expiration_year: "Expiry year",
};

/** `city_a` becomes "Billing · City"; `credit_card_number` "Payment · Card number". */
function checkoutFieldLabel(param: string): string {
  if (PAYMENT_LABELS[param]) {
    return `Payment · ${PAYMENT_LABELS[param]}`;
  }
  const section = param.endsWith("_a") ? "Billing" : param.endsWith("_b") ? "Shipping" : null;
  if (section !== null) {
    const base = param.slice(0, -2);
    const field = CONTACT_INFO_FIELDS.find((f) => f.param === base);
    if (field) {
      return `${section} · ${field.label}`;
    }
  }
  return param;
}

export interface CheckoutErrorsProps {
  missingFields: string[];
  fieldErrors: Record<string, string>;
}

export const CheckoutErrors = React.forwardRef<HTMLDivElement, CheckoutErrorsProps>(
  ({ missingFields, fieldErrors }, ref) => {
    // Fields that are present but invalid (a bad expiry, a malformed email) follow the missing ones.
    const invalid = Object.keys(fieldErrors).filter((param) => !missingFields.includes(param));
    const listed = [...missingFields, ...invalid];
    const heading =
      missingFields.length > 0
        ? `Your order was not placed — ${missingFields.length} required ${
            missingFields.length === 1 ? "field is" : "fields are"
          } missing`
        : "Your order was not placed — some fields need correcting";

    return (
      <Alert ref={ref} variant="destructive" tabIndex={-1}>
        <h3 className="font-semibold">{heading}</h3>
        <AlertDescription>
          <p>
            Fill in the fields listed below, then choose Place order again. Your cart has not
            changed.
          </p>
          <ul className="mt-2 list-disc pl-5">
            {listed.map((param) => (
              <li key={param}>{checkoutFieldLabel(param)}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  },
);
CheckoutErrors.displayName = "CheckoutErrors";

export function EmptyCartState(): React.ReactElement {
  return (
    <main className="mx-auto max-w-[640px] px-4 py-16 text-center">
      <h1 className="mb-2.5 text-[26px] font-semibold tracking-tight">
        Your shopping cart is empty
      </h1>
      <p className="text-muted-foreground text-[14.5px] leading-relaxed">
        Checkout needs at least one item, so no order was created and nothing has been charged.
        Carts are kept for this browser session only — if you signed out or opened a new browser,
        the items you added earlier are not here.
      </p>
      <Alert variant="destructive" className="mt-6 text-left">
        <AlertDescription>{EMPTY_CART_CHECKOUT_MESSAGE}</AlertDescription>
      </Alert>
      <div className="mt-6 flex justify-center gap-2.5">
        <Link to="/" className={cn(buttonVariants({ size: "lg" }))}>
          Continue shopping
        </Link>
        <Link to={CART_PATH} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          Back to shopping cart
        </Link>
      </div>
      <p className="text-muted-foreground mt-8 text-xs leading-relaxed">
        Your billing address, shipping address and stored card are still on your account — they will
        be pre-filled next time you check out.
      </p>
    </main>
  );
}
