import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { accounts, orderStageHistory, orders } from "../db/schema";
import { InvalidTransitionError } from "./errors";
import {
  WORKFLOW_STAGES,
  assertStageTransition,
  nextStage,
  setWorkflowStage,
  type WorkflowStage,
} from "./workflow-stage";

/**
 * UNIT TEST (server project). design.md D1, C3: the workflow stages move only
 * one step forward, and each change is written with a timestamp. Runs against
 * the in-memory db (VITEST=true).
 */
let counter = 0;

function insertOrder(stage: WorkflowStage = "PENDING"): number {
  counter += 1;
  const account = db
    .insert(accounts)
    .values({ username: `stageuser${counter}`, passwordHash: "not-a-real-hash" })
    .returning({ id: accounts.id })
    .get();
  return db
    .insert(orders)
    .values({
      accountId: account.id,
      customerName: "Alice Anderson",
      orderDate: new Date("2026-01-01T00:00:00.000Z"),
      totalCents: 1000,
      workflowStage: stage,
    })
    .returning({ id: orders.id })
    .get().id;
}

const orderRow = (id: number) => db.select().from(orders).where(eq(orders.id, id)).get();
const history = (id: number) =>
  db.select().from(orderStageHistory).where(eq(orderStageHistory.orderId, id)).all();

describe("workflow stages", () => {
  it("[SWHR3-C-0170] the vocabulary is the seven stages in order", () => {
    expect(WORKFLOW_STAGES).toEqual([
      "PENDING",
      "PAID",
      "CONFIRMED",
      "ALLOCATED",
      "SHIPPED",
      "DELIVERED",
      "COMPLETED",
    ]);
    expect(nextStage("PENDING")).toBe("PAID");
    expect(nextStage("COMPLETED")).toBeNull();
  });

  const pairs = WORKFLOW_STAGES.flatMap((from, i) =>
    WORKFLOW_STAGES.map((to, j) => [from, to, j === i + 1] as const),
  );

  it.each(pairs)("[SWHR3-C-0170] %s -> %s is legal: %s", (from, to, legal) => {
    if (legal) {
      expect(() => assertStageTransition(1, from, to)).not.toThrow();
    } else {
      expect(() => assertStageTransition(1, from, to)).toThrow(InvalidTransitionError);
    }
  });

  it("[SWHR3-C-0169] PENDING moves to PAID and appends a timestamped history row", () => {
    const id = insertOrder();

    db.transaction((tx) => setWorkflowStage(tx, id, "PAID"));

    expect(orderRow(id)).toMatchObject({ workflowStage: "PAID", status: "PENDING" });
    const rows = history(id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ stage: "PAID" });
    expect(rows[0].changedAt).toBeInstanceOf(Date);
  });

  it("[SWHR3-C-0169] PENDING to CONFIRMED throws and changes nothing", () => {
    const id = insertOrder();

    expect(() => db.transaction((tx) => setWorkflowStage(tx, id, "CONFIRMED"))).toThrow(
      InvalidTransitionError,
    );

    expect(orderRow(id)).toMatchObject({ workflowStage: "PENDING", status: "PENDING" });
    expect(history(id)).toHaveLength(0);
  });

  it("[SWHR3-C-0169] PAID to PENDING throws and changes nothing", () => {
    const id = insertOrder("PAID");

    expect(() => db.transaction((tx) => setWorkflowStage(tx, id, "PENDING"))).toThrow(
      InvalidTransitionError,
    );

    expect(orderRow(id)?.workflowStage).toBe("PAID");
    expect(history(id)).toHaveLength(0);
  });
});
