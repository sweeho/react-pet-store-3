import type { AssignableStatus } from "@/constants/order-status";

export interface RefreshOrdersControlProps {
  staged: ReadonlyMap<number, AssignableStatus>;
  onRefresh: () => void;
  onDiscard: () => void;
}

export function RefreshOrdersControl(props: RefreshOrdersControlProps) {
  void props;
  throw new Error("VortexNotImplemented");
}
