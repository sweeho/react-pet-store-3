import type { DbOrTx } from "./transaction";

export type CartAction =
  | { type: "ADD_ITEM"; itemId: string; quantity?: number }
  | { type: "DELETE_ITEM"; itemId: string }
  | { type: "UPDATE_ITEMS"; items: Record<string, number> }
  | { type: "EMPTY" };

export function applyCartAction(sessionToken: string, action: CartAction, outer?: DbOrTx): void {
  void sessionToken;
  void action;
  void outer;
  throw new Error("VortexNotImplemented");
}
