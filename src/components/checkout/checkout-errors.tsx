export interface CheckoutErrorsProps {
  missingFields: string[];
  fieldErrors: Record<string, string>;
}

export function checkoutFieldLabel(param: string): string {
  void param;
  throw new Error("VortexNotImplemented");
}

export function CheckoutErrors(props: CheckoutErrorsProps): React.ReactElement {
  void props;
  throw new Error("VortexNotImplemented");
}

export function EmptyCartState(): React.ReactElement {
  throw new Error("VortexNotImplemented");
}
