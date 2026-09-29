export function allocateOrder(): "ALLOCATED" | "WAITING" | "SKIPPED" {
  throw new Error("VortexNotImplemented");
}

export function retryWaitingAllocations(): number {
  throw new Error("VortexNotImplemented");
}

export function recordShipment(): { orderCompleted: boolean } {
  throw new Error("VortexNotImplemented");
}
