/**
 * /orders/:id (design.md D12, C9, C10): the order confirmation, built from
 * mockup-order-confirmation.html (main content only; storefront chrome is out
 * of scope, SD12). A signed-out visitor goes to /signin and returns here;
 * an unknown or foreign order shows a not-found alert.
 */
import { Link, Navigate, useParams } from "react-router";

import { Alert, AlertDescription } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button-variants";
import type { ContactInfo, OrderConfirmation } from "@/types/checkout";
import { ApiError } from "@/utils/api";
import { cn } from "@/utils";
import { getOrder } from "@/utils/orders-api";

const PRICE_FORMATTER = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const NOT_FOUND_MESSAGE = "We could not find that order.";

function formatCents(cents: number): string {
  return PRICE_FORMATTER.format(cents / 100);
}

function AddressBlock({ title, contact }: { title: string; contact: ContactInfo }) {
  const street = contact.address2 ? `${contact.address1}, ${contact.address2}` : contact.address1;
  return (
    <div role="group" aria-label={title}>
      <h4 className="text-muted-foreground mb-2 text-[11.5px] font-medium tracking-wider uppercase">
        {title}
      </h4>
      <p className="text-[13.5px] leading-relaxed">
        <span className="block">
          {contact.givenName} {contact.familyName}
        </span>
        <span className="block">{street}</span>
        <span className="block">
          {contact.city}, {contact.stateOrProvince} {contact.postalCode}
        </span>
        <span className="block">{contact.country}</span>
        <span className="block">{contact.telephoneNumber}</span>
      </p>
    </div>
  );
}

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const orderId = /^\d+$/.test(id ?? "") ? Number(id) : null;
  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [failure, setFailure] = useState<"unauthorized" | "not-found" | "error" | null>(
    orderId === null ? "not-found" : null,
  );

  useEffect(() => {
    if (orderId === null) {
      return;
    }
    getOrder(orderId)
      .then(setOrder)
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          setFailure("unauthorized");
        } else if (error instanceof ApiError && error.status === 404) {
          setFailure("not-found");
        } else {
          setFailure("error");
        }
      });
  }, [orderId]);

  if (failure === "unauthorized") {
    return <Navigate replace to={`/signin?redirect=${encodeURIComponent(`/orders/${id}`)}`} />;
  }

  if (failure !== null) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {failure === "not-found" ? NOT_FOUND_MESSAGE : "Your order could not be loaded."}
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  if (order === null) {
    return <main className="mx-auto max-w-3xl p-6" aria-busy="true" />;
  }

  const itemCount = order.lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <main className="mx-auto max-w-[780px] px-4 pt-12 pb-16">
      <div className="text-center">
        <h1 className="mb-2.5 text-[26px] font-semibold tracking-tight">
          Thank you — your order has been received
        </h1>
        <p className="text-muted-foreground text-[14.5px] leading-relaxed">
          We have emailed a confirmation to{" "}
          <strong className="text-foreground font-medium">{order.email}</strong>. You will get
          another email when your order is approved, and again when it is complete.
        </p>
      </div>

      <div className="border-border bg-muted mt-8 flex flex-wrap items-center justify-between gap-5 rounded-xl border px-6 py-4">
        <div>
          <div className="text-muted-foreground text-xs">Order number</div>
          <div className="mt-1 text-[23px] font-bold tracking-tight">{order.orderId}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">Order date</div>
          <div className="mt-1 text-[15px] font-medium">
            {DATE_FORMATTER.format(new Date(order.orderDate))}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">Notifications sent to</div>
          <div className="mt-1 text-[15px] font-medium">{order.email}</div>
        </div>
      </div>

      <p className="text-muted-foreground mt-3.5 text-[12.5px] leading-relaxed">
        Keep this order number. Orders cannot be looked up, changed or cancelled after this point —
        email is how you will hear about every status change.
      </p>

      <section
        aria-label="What you ordered"
        className="border-border bg-card mt-5 rounded-lg border shadow-sm"
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold">What you ordered</h2>
          <span className="text-muted-foreground text-xs">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>
        <div className="px-5 py-4">
          {order.lines.map((line) => (
            <div
              key={line.itemId}
              className="border-border flex gap-3 border-b py-3.5 first:pt-0"
              data-testid="order-line"
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
              {formatCents(order.totalCents)}
            </span>
          </div>
        </div>

        <div className="border-border grid gap-5 border-t px-5 py-4 sm:grid-cols-2">
          <AddressBlock title="Billed to" contact={order.billTo} />
          <AddressBlock title="Shipped to" contact={order.shipTo} />
        </div>

        <div className="border-border flex flex-wrap items-center gap-2.5 border-t px-5 py-4 text-[13.5px]">
          <span>
            {order.card.cardType} ending {order.card.last4} · Expires {order.card.expiryDate}
          </span>
          <span className="text-muted-foreground ml-auto text-xs">
            Stored with the order. No payment has been taken.
          </span>
        </div>
      </section>

      <div className="mt-6 flex justify-center">
        <Link to="/" className={cn(buttonVariants({ size: "lg" }))}>
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
