/**
 * Dispatches a CartAction to lib/cart.ts inside one immediate-mode
 * transaction (design.md D2, D8, C5), so an UPDATE_ITEMS batch commits or
 * rolls back as a unit. Given an outer transaction it joins it (SD2).
 */
import { addItem, deleteItem, empty, updateItemQuantity } from "./cart";
import { type DbOrTx, withTransaction } from "./transaction";

export type CartAction =
  | { type: "ADD_ITEM"; itemId: string; quantity?: number }
  | { type: "DELETE_ITEM"; itemId: string }
  | { type: "UPDATE_ITEMS"; items: Record<string, number> }
  | { type: "EMPTY" };

export function applyCartAction(sessionToken: string, action: CartAction, outer?: DbOrTx): void {
  withTransaction(
    (tx) => {
      switch (action.type) {
        case "ADD_ITEM":
          addItem(sessionToken, action.itemId, action.quantity, tx);
          return;
        case "DELETE_ITEM":
          deleteItem(sessionToken, action.itemId, tx);
          return;
        case "UPDATE_ITEMS":
          for (const [itemId, quantity] of Object.entries(action.items)) {
            updateItemQuantity(sessionToken, itemId, quantity, tx);
          }
          return;
        case "EMPTY":
          empty(sessionToken, tx);
          return;
      }
    },
    outer,
    { behavior: "immediate" },
  );
}
