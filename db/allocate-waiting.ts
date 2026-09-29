/**
 * Operator script (design.md D5, C9): re-runs allocation for every approved
 * order waiting for stock and prints {"allocated":<n>} as the last line.
 *
 * Usage: bun db/allocate-waiting.ts
 */
import { retryWaitingAllocations } from "../lib/process-manager";

console.log(JSON.stringify({ allocated: retryWaitingAllocations() }));
