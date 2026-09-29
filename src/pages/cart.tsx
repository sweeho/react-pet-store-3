/**
 * /cart (design.md D9, C10): renders the CartView from GET /api/cart. Every
 * response from an update or remove replaces the state, so removing the
 * last line shows the empty message.
 */
import { Link } from "react-router";

import { CartTable, QUANTITY_FIELD_PREFIX } from "@/components/cart/cart-table";
import { Alert, AlertDescription, Button } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button-variants";
import { CHECKOUT_PATH, EMPTY_CART_MESSAGE } from "@/constants/cart";
import type { CartView } from "@/types/cart";
import { cn } from "@/utils";
import { getCart, removeFromCart, updateCart } from "@/utils/cart-api";

export default function Cart() {
  const [cart, setCart] = useState<CartView | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    getCart()
      .then(setCart)
      .catch(() => setFailed("Your cart could not be loaded."));
  }, []);

  function run(request: Promise<CartView>) {
    setFailed(null);
    request.then(setCart).catch(() => setFailed("Your cart could not be updated."));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields: Record<string, string> = {};
    for (const [name, value] of new FormData(event.currentTarget).entries()) {
      if (name.startsWith(QUANTITY_FIELD_PREFIX) && typeof value === "string") {
        fields[name] = value;
      }
    }
    run(updateCart(fields));
  }

  if (cart === null) {
    if (failed !== null) {
      return (
        <main className="mx-auto max-w-3xl p-6">
          <Alert variant="destructive">
            <AlertDescription>{failed}</AlertDescription>
          </Alert>
        </main>
      );
    }
    return <main className="mx-auto max-w-3xl p-6" aria-busy="true" />;
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Shopping Cart</h1>
      {failed !== null && (
        <Alert variant="destructive">
          <AlertDescription>{failed}</AlertDescription>
        </Alert>
      )}
      {cart.count === 0 ? (
        <p>{EMPTY_CART_MESSAGE}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <CartTable
            lines={cart.items}
            subtotalCents={cart.subtotalCents}
            onRemove={(itemId) => run(removeFromCart(itemId))}
          />
          <div className="flex gap-3">
            <Button type="submit">Update Cart</Button>
            <Link to={CHECKOUT_PATH} className={cn(buttonVariants({ variant: "outline" }))}>
              Check Out
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}
