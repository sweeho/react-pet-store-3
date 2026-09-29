/**
 * /checkout (design.md D10, SD9): a guard placeholder until order-checkout
 * exists. An empty cart is refused with the empty-cart error and a link back
 * to /cart; a populated cart shows the "Enter Order Information" heading,
 * which order-checkout replaces with the real form.
 */
import { Link } from "react-router";

import { Alert, AlertDescription } from "@/components/ui";
import { CART_PATH, EMPTY_CART_CHECKOUT_MESSAGE } from "@/constants/cart";
import type { CartView } from "@/types/cart";
import { getCart } from "@/utils/cart-api";

export default function Checkout() {
  const [cart, setCart] = useState<CartView | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    getCart()
      .then(setCart)
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

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Enter Order Information</h1>
    </main>
  );
}
