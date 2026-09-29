import type { ReactNode } from "react";

export function AccessDenied() {
  throw new Error("VortexNotImplemented");
}

export function RequireSupplier(props: { children: ReactNode }) {
  void props;
  throw new Error("VortexNotImplemented");
}
