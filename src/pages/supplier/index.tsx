/**
 * /supplier (design.md D7, D8, SD7 of supplier-portal-and-inventory, mockup-
 * supplier-inventory-listing-and-update.html and ...-after-update.html):
 * every catalogue item with its current quantity, a new-quantity input and an
 * update checkbox per row. Update inventory sends the entered rows through
 * updateInventory; the response refreshes the rows and marks the saved ones.
 * Invalid rows are skipped by the server without an error (SD7).
 */
import { CheckCircle2, RefreshCw } from "lucide-react";

import { InventoryTable } from "@/components/supplier/inventory-table";
import { RequireSupplier } from "@/components/supplier/require-supplier";
import { SupplierShell } from "@/components/supplier/supplier-shell";
import { Alert, AlertDescription, Button } from "@/components/ui";
import type { InventoryRow } from "@/types/supplier";
import { getInventory, updateInventory } from "@/utils/supplier-api";

export default function SupplierInventory() {
  const [rows, setRows] = useState<InventoryRow[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [updateFailed, setUpdateFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedItemIds, setSavedItemIds] = useState<string[]>([]);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  // Bumping the key remounts the table, clearing its entries after a save.
  const [tableKey, setTableKey] = useState(0);
  const fields = useRef<Record<string, string | boolean>>({});

  useEffect(() => {
    getInventory()
      .then(setRows)
      .catch(() => setLoadFailed(true));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUpdateFailed(false);
    setSaving(true);
    try {
      const result = await updateInventory(fields.current);
      setRows(result.inventory);
      setSavedItemIds(result.updated);
      setSavedCount(result.updated.length);
      fields.current = {};
      setTableKey((key) => key + 1);
    } catch {
      setUpdateFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireSupplier>
      <SupplierShell>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        {loadFailed && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>Inventory could not be loaded.</AlertDescription>
          </Alert>
        )}
        {rows !== null && (
          <>
            <p className="text-muted-foreground mt-1 text-sm">
              {rows.length} items. Enter a new quantity and tick the row to include it — unticked
              rows are ignored.
            </p>
            {savedCount !== null && (
              <div className="border-border bg-card mt-5 flex items-start gap-3 rounded-lg border p-4 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div>
                  <p className="font-medium">
                    Inventory updated — {savedCount} {savedCount === 1 ? "item" : "items"} saved.
                  </p>
                  <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[13px]">
                    <RefreshCw className="h-3 w-3" aria-hidden />
                    Pending supplier orders are being reprocessed against the new quantities.
                  </p>
                </div>
              </div>
            )}
            {updateFailed && (
              <Alert variant="destructive" className="mt-5">
                <AlertDescription>Inventory could not be updated.</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="mt-5">
              <InventoryTable
                key={tableKey}
                rows={rows}
                savedItemIds={savedItemIds}
                onFieldsChange={(next) => {
                  fields.current = next;
                }}
                footerAction={
                  <Button type="submit" disabled={saving}>
                    Update inventory
                  </Button>
                }
              />
            </form>
          </>
        )}
      </SupplierShell>
    </RequireSupplier>
  );
}
