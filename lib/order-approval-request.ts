/**
 * Parses a commit request body into an OrderApproval (design.md C5, SD2,
 * SD4 — JSON stands in for the legacy XML OrderApproval message). Every
 * failure is one ValidationError (422) with every offending field named at
 * once, keyed requestType, changes, or changes.<index>.orderId|status.
 */
import { ValidationError } from "./errors";
import type { ChangedOrder, OrderApproval } from "./order-approval";
import { isAssignableStatus } from "./order-status";

const MAX_CHANGES = 500;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function parseOrderApprovalRequest(body: unknown): OrderApproval {
  const fieldErrors: Record<string, string> = {};
  const record = isRecord(body) ? body : {};

  if (record.requestType !== "UPDATESTATUS") {
    fieldErrors.requestType = 'requestType must be "UPDATESTATUS"';
  }

  const rawChanges = record.changes;
  if (!Array.isArray(rawChanges) || rawChanges.length === 0) {
    fieldErrors.changes = "changes must be a non-empty array";
  } else if (rawChanges.length > MAX_CHANGES) {
    fieldErrors.changes = `changes must contain at most ${MAX_CHANGES} entries`;
  } else {
    const seenOrderIds = new Set<number>();
    rawChanges.forEach((raw, index) => {
      const entry = isRecord(raw) ? raw : {};
      const { orderId, status } = entry;

      if (!isPositiveInteger(orderId)) {
        fieldErrors[`changes.${index}.orderId`] = "orderId must be a positive integer";
      } else if (seenOrderIds.has(orderId)) {
        fieldErrors[`changes.${index}.orderId`] = `orderId ${orderId} is duplicated`;
      } else {
        seenOrderIds.add(orderId);
      }

      if (!isAssignableStatus(status)) {
        fieldErrors[`changes.${index}.status`] = "status must be APPROVED or DENIED";
      }
    });
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError(fieldErrors);
  }

  // Every entry above passed isPositiveInteger(orderId) and
  // isAssignableStatus(status), or fieldErrors would be non-empty and the
  // function would already have thrown, so this narrowing is safe.
  const changes = (rawChanges as Array<{ orderId: number; status: unknown }>).map(
    ({ orderId, status }) => ({ orderId, status }) as ChangedOrder,
  );

  return { changes };
}
