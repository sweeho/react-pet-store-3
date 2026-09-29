/**
 * /checkout (design.md D10, D13, SD8, SD9): the three-section order form for
 * a non-empty cart, built from mockup-checkout-enter-order-information.html
 * (main content only, SD12). An empty cart is refused with the empty-cart
 * error and a link back to /cart. Billing is pre-filled from the profile
 * (a 404 means none); shipping starts blank, with "Same as billing address"
 * copying billing into it. The form sets noValidate so the server reports
 * every missing field at once (D13). On success it navigates to /orders/:id.
 */
import { Link } from "react-router";

import { AddressFields, type AddressValues } from "@/components/checkout/address-fields";
import { PaymentFields } from "@/components/checkout/payment-fields";
import { Alert, AlertDescription, Button, Checkbox } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button-variants";
import { CART_PATH, EMPTY_CART_CHECKOUT_MESSAGE } from "@/constants/cart";
import { ORDER_CONFIRMATION_PATH } from "@/constants/checkout";
import type { CartView } from "@/types/cart";
import type { CustomerProfile } from "@/types/customer-profile";
import { CONTACT_INFO_FIELDS, type ContactInfo } from "@/types/checkout";
import { cn } from "@/utils";
import { apiFetch } from "@/utils/api";
import { getCart } from "@/utils/cart-api";
import { placeOrder } from "@/utils/orders-api";

const PRICE_FORMATTER = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function formatCents(cents: number): string {
  return PRICE_FORMATTER.format(cents / 100);
}

const BLANK_ADDRESS: AddressValues = {
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

function addressFromProfile(profile: CustomerProfile): AddressValues {
  return {
    familyName: profile.lastName,
    givenName: profile.firstName,
    address1: profile.address.street1,
    address2: profile.address.street2 ?? "",
    city: profile.address.city,
    stateOrProvince: profile.address.state,
    postalCode: profile.address.postalCode,
    country: profile.address.country,
    telephoneNumber: profile.telephone,
    email: profile.email,
  };
}

// A missing profile (404) or any profile failure just means no pre-fill (D10).
function loadProfile(): Promise<CustomerProfile | null> {
  return apiFetch<{ customer: CustomerProfile }>("/api/customers/me")
    .then((response) => response.customer)
    .catch(() => null);
}

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartView | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [billing, setBilling] = useState<AddressValues>(BLANK_ADDRESS);
  const [shipping, setShipping] = useState<AddressValues>(BLANK_ADDRESS);
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);

  useEffect(() => {
    Promise.all([getCart(), loadProfile()])
      .then(([loadedCart, profile]) => {
        if (profile !== null) {
          setBilling(addressFromProfile(profile));
          setPrefilled(true);
        }
        setCart(loadedCart);
      })
      .catch(() => setLoadFailed(true));
  }, []);

  if (loadFailed) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <Alert variant="destructive">
          <AlertDescription>Your cart could not be loaded.</AlertDescription>
        </Alert>
      </main>
    );
  }

  if (cart === null) {
    return <main className="mx-auto max-w-3xl p-6" aria-busy="true" />;
  }

  if (cart.count === 0) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <Alert variant="destructive">
          <AlertDescription>{EMPTY_CART_CHECKOUT_MESSAGE}</AlertDescription>
        </Alert>
        <Link to={CART_PATH} className="underline">
          Return to your shopping cart
        </Link>
      </main>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields: Record<string, string> = {};
    for (const [name, value] of new FormData(event.currentTarget).entries()) {
      if (typeof value === "string") {
        fields[name] = value;
      }
    }
    if (sameAsBilling) {
      // Disabled inputs are left out of FormData, so copy billing across.
      for (const field of CONTACT_INFO_FIELDS) {
        fields[`${field.param}_b`] = fields[`${field.param}_a`] ?? "";
      }
    }
    setSubmitting(true);
    setSubmitFailed(false);
    placeOrder(fields)
      .then((placed) => navigate(ORDER_CONFIRMATION_PATH(placed.orderId)))
      .catch(() => {
        setSubmitFailed(true);
        setSubmitting(false);
      });
  }

  const shippingValues = sameAsBilling ? billing : shipping;

  return (
    <main className="mx-auto max-w-[1100px] px-4 pt-8 pb-16">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
      <h2 className="sr-only">Enter Order Information</h2>
      <p className="text-muted-foreground mt-1.5 mb-6 text-sm">
        Confirm where the order is billed and shipped, then place it. All fields are required except
        the second address line.
      </p>
      <form
        noValidate
        onSubmit={handleSubmit}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="space-y-5">
          {submitFailed && (
            <Alert variant="destructive">
              <AlertDescription>
                Your order could not be placed. Please check the form and try again.
              </AlertDescription>
            </Alert>
          )}
          <AddressFields
            step={1}
            title="Billing address"
            hint={prefilled ? "Pre-filled from your account" : undefined}
            suffix="_a"
            values={billing}
            onChange={(key: keyof ContactInfo, value) =>
              setBilling((current) => ({ ...current, [key]: value }))
            }
            after={
              <p className="text-muted-foreground text-xs">
                Order updates are sent to the email address in this billing section — approval,
                denial and completion.
              </p>
            }
          />
          <AddressFields
            step={2}
            title="Shipping address"
            hint="Where the pets are delivered"
            suffix="_b"
            values={shippingValues}
            disabled={sameAsBilling}
            onChange={(key: keyof ContactInfo, value) =>
              setShipping((current) => ({ ...current, [key]: value }))
            }
            before={
              <div className="mb-4">
                <Checkbox
                  label="Same as billing address"
                  checked={sameAsBilling}
                  onChange={(event) => setSameAsBilling(event.target.checked)}
                />
              </div>
            }
          />
          <PaymentFields />
        </div>

        <aside className="border-border bg-card rounded-lg border shadow-sm lg:sticky lg:top-6">
          <div className="border-border flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-base font-semibold">Order summary</h2>
            <Link to={CART_PATH} className="text-muted-foreground text-xs underline">
              Edit cart
            </Link>
          </div>
          <div className="px-5 py-4">
            {cart.items.map((line) => (
              <div
                key={line.itemId}
                className="border-border flex gap-3 border-b py-3.5 first:pt-0"
              >
                <div className="min-w-0 flex-1">
                  <span className="block text-[13.5px] leading-snug font-medium">{line.name}</span>
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    {line.itemId} · {formatCents(line.unitCostCents)} × {line.quantity}
                  </span>
                </div>
                <span className="ml-auto text-[13.5px] font-medium whitespace-nowrap">
                  {formatCents(line.totalCostCents)}
                </span>
              </div>
            ))}
            <div className="flex items-baseline justify-between pt-4">
              <span className="text-sm font-semibold">Order total</span>
              <span className="text-xl font-bold tracking-tight">
                {formatCents(cart.subtotalCents)}
              </span>
            </div>
            <Button type="submit" size="lg" className="mt-4 w-full" disabled={submitting}>
              Place order
            </Button>
            <Link
              to={CART_PATH}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-2.5 w-full")}
            >
              Back to shopping cart
            </Link>
            <p className="text-muted-foreground mt-3.5 text-xs leading-relaxed">
              The addresses above are saved with this order. Later changes to your account profile
              do not change it.
            </p>
          </div>
        </aside>
      </form>
    </main>
  );
}
