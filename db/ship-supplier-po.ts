/**
 * Operator script (design.md C9): records a supplier shipment and prints
 * {"orderCompleted":<bool>} as the last line of stdout.
 *
 * Usage: bun db/ship-supplier-po.ts --po <id> --tracking <number>
 */
import { recordShipment } from "../lib/process-manager";

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

const po = Number(argValue("--po"));
const tracking = argValue("--tracking");
if (!Number.isInteger(po) || po < 1 || !tracking) {
  console.error("Usage: bun db/ship-supplier-po.ts --po <id> --tracking <number>");
  process.exit(1);
}

console.log(JSON.stringify(recordShipment(po, tracking)));
