import { describe, expect, it } from "vitest";

import { ValidationError } from "./errors";
import { parseOrderApprovalRequest } from "./order-approval-request";

/**
 * UNIT TEST (server project)
 *
 * Covers design.md C5: parseOrderApprovalRequest returns an OrderApproval
 * (SD2/SD4 — the batch service's ChangedOrder[] built from the request
 * body) or throws ValidationError (422) with fieldErrors keyed requestType,
 * changes, or changes.<index>.orderId|status.
 */
describe("parseOrderApprovalRequest", () => {
  it("[SWHR3-C-0014] extracts orderId and status from each change", () => {
    const result = parseOrderApprovalRequest({
      requestType: "UPDATESTATUS",
      changes: [
        { orderId: 1001, status: "APPROVED" },
        { orderId: 1002, status: "DENIED" },
      ],
    });

    expect(result).toEqual({
      changes: [
        { orderId: 1001, status: "APPROVED" },
        { orderId: 1002, status: "DENIED" },
      ],
    });
  });

  it("[SWHR3-C-0015] rejects a change with an invalid orderId or status", () => {
    expect(() =>
      parseOrderApprovalRequest({
        requestType: "UPDATESTATUS",
        changes: [
          { orderId: 0, status: "APPROVED" },
          { orderId: 7, status: "COMPLETED" },
        ],
      }),
    ).toThrow(ValidationError);

    try {
      parseOrderApprovalRequest({
        requestType: "UPDATESTATUS",
        changes: [
          { orderId: 0, status: "APPROVED" },
          { orderId: 7, status: "COMPLETED" },
        ],
      });
      expect.unreachable("expected parseOrderApprovalRequest to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const fieldErrors = (error as ValidationError).fieldErrors;
      expect(Object.keys(fieldErrors)).toEqual(
        expect.arrayContaining(["changes.0.orderId", "changes.1.status"]),
      );
    }
  });

  it("[SWHR3-C-0030] rejects a requestType other than UPDATESTATUS, so it never reaches updateOrders", () => {
    try {
      parseOrderApprovalRequest({
        requestType: "GETORDERS",
        changes: [{ orderId: 1001, status: "APPROVED" }],
      });
      expect.unreachable("expected parseOrderApprovalRequest to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fieldErrors).toHaveProperty("requestType");
    }
  });

  it("[SWHR3-C-0031] turns a single request entry into a ChangedOrder", () => {
    const result = parseOrderApprovalRequest({
      requestType: "UPDATESTATUS",
      changes: [{ orderId: 42, status: "DENIED" }],
    });

    expect(result.changes[0]).toEqual({ orderId: 42, status: "DENIED" });
  });

  it("[SWHR3-C-0032] collects every parsed change into one OrderApproval", () => {
    const input = [1, 2, 3, 4, 5].map((n) => ({
      orderId: n,
      status: n % 2 === 0 ? "APPROVED" : "DENIED",
    }));

    const result = parseOrderApprovalRequest({ requestType: "UPDATESTATUS", changes: input });

    expect(result.changes).toHaveLength(5);
    expect(result.changes).toEqual(input);
  });

  it("[SWHR3-C-0033] rejects a request with a duplicate orderId", () => {
    try {
      parseOrderApprovalRequest({
        requestType: "UPDATESTATUS",
        changes: [
          { orderId: 7, status: "APPROVED" },
          { orderId: 7, status: "DENIED" },
        ],
      });
      expect.unreachable("expected parseOrderApprovalRequest to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fieldErrors).toHaveProperty("changes.1.orderId");
    }
  });

  it("rejects a missing or empty changes array", () => {
    expect(() => parseOrderApprovalRequest({ requestType: "UPDATESTATUS" })).toThrow(
      ValidationError,
    );
    try {
      parseOrderApprovalRequest({ requestType: "UPDATESTATUS", changes: [] });
      expect.unreachable("expected parseOrderApprovalRequest to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fieldErrors).toHaveProperty("changes");
    }
  });

  it("rejects more than 500 changes", () => {
    const changes = Array.from({ length: 501 }, (_, i) => ({
      orderId: i + 1,
      status: "APPROVED",
    }));

    try {
      parseOrderApprovalRequest({ requestType: "UPDATESTATUS", changes });
      expect.unreachable("expected parseOrderApprovalRequest to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fieldErrors).toHaveProperty("changes");
    }
  });

  it("rejects a non-integer or non-positive orderId", () => {
    try {
      parseOrderApprovalRequest({
        requestType: "UPDATESTATUS",
        changes: [
          { orderId: -1, status: "APPROVED" },
          { orderId: 1.5, status: "APPROVED" },
        ],
      });
      expect.unreachable("expected parseOrderApprovalRequest to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const fieldErrors = (error as ValidationError).fieldErrors;
      expect(fieldErrors).toHaveProperty("changes.0.orderId");
      expect(fieldErrors).toHaveProperty("changes.1.orderId");
    }
  });
});
