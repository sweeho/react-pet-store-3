# Design System

See [PRODUCT.md](./PRODUCT.md) for what this is, [ARCHITECTURE.md](./ARCHITECTURE.md) for how it's built.

## Tokens

OKLCH custom properties in `src/index.css` (`:root` light, `.dark` dark), mapped to Tailwind utilities via `@theme inline`. Add a token in both places + the theme block, or Tailwind won't generate a class for it.

| Token                                                | Tailwind class                                       |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `--background` / `--foreground`                      | `bg-background` / `text-foreground`                  |
| `--primary` / `--secondary` / `--muted` / `--accent` | `bg-*`                                               |
| `--destructive`                                      | `bg-destructive`                                     |
| `--border` / `--input` / `--ring`                    | `border-border` / `border-input` / `outline-ring/50` |
| `--radius` (+ `sm`/`md`/`lg`/`xl`)                   | `rounded-*`                                          |

Known bug: light-mode `--destructive-foreground` duplicates `--destructive` (text would be invisible). Dark mode has it right. Use `text-destructive` on a light surface for error text, not `text-destructive-foreground`.

## Theming

Dark-mode tokens exist but no toggle is wired up — nothing sets `.dark` on `<html>` yet.

## Components

Pattern (see `src/components/ui/button.tsx` + `button-variants.ts`):

- Variants via `class-variance-authority`
- Class merging via `cn()` (`clsx` + `tailwind-merge`) — always last, so callers can override
- Polymorphism via Radix `Slot` (`asChild` prop)
- Variants exported from a separate `*-variants.ts` file, not the component file (avoids an `eslint-plugin-react-refresh` warning)

New shared components go in `src/components/ui/`, follow this pattern, get a `*.test.tsx`.

Inventory: `Button`, `Input`, `Label`, `Checkbox`, `Select`, `Alert`, `FormField`, `Table`, `Badge`, `Dialog`.

- **Table**: styled native `<table>` parts. A sortable column header is a button that sets `aria-sort` on its `<th>`; the data is sorted by the caller, not by the table.
- **Badge**: a short uppercase status label with one variant per state (for orders: pending, approved, denied, completed, and staged for a change not yet saved). It never carries an action.
- **Dialog**: a modal built on `@headlessui/react` `Dialog`. It traps focus, closes on Escape, and returns focus to the control that opened it. The title states the question, and the buttons name their outcomes ("Refresh anyway", not "OK").

## Forms

Every form is built from the same pieces, so later forms (checkout, admin) look and behave like the first ones.

- **Field**: `FormField` stacks a `Label`, the control, optional helper text in `text-muted-foreground`, and an error line in `text-destructive`. The error is linked to the control with `aria-invalid` and `aria-describedby`, so a screen reader reads it with the field.
- **Controls**: native elements styled with tokens only. `Input` and `Select` have a `border-input` border, `rounded-md` corners and a `--ring` focus outline. `Checkbox` pairs its box with a label and a one-line helper.
- **Required and optional**: required is the default. On a short form it is enforced by the browser (`required`, `maxLength`) before anything is sent. A long, multi-section form (checkout) sets `noValidate` and lets the server report every missing field in one response, because the browser stops at the first empty field and accepts whitespace. An optional field is labelled "(optional)" (on checkout, an "Optional" tag beside the label, per its mockup) rather than marking every required field.
- **Two layers of errors**:
  - A problem with one field shows under that field, and the form keeps every value the user typed.
  - A problem with the whole submission (wrong credentials, a taken user name) shows as an `Alert` (`destructive`, `role="alert"`) above the fields it concerns: above both panels when it applies to the page, inside a panel when it applies only to that panel.
  - When a long form is refused for several missing fields, a summary `Alert` above the first section counts them and lists each one as "<Section> · <Field>". Focus moves to it, and each field still shows its own message.
- **Sensitive fields**: a failed sign-in clears the password and keeps the user name. A stored card number is never shown back; it appears as `•••• 1234`, and typing a new number replaces it.
- **Read-only facts**: something the user cannot change, such as the user name after registration, is shown as text with a one-line explanation, not as a disabled input.
- **Actions**: the primary action (`Button` default variant) ends the form on the right, with the secondary action (`outline`) beside it.

Reference screens: the sign-in, create-account and account-profile mockups under `artifacts/SWHR3-S-0001/design/`, and the checkout mockups under `artifacts/SWHR3-S-0006/design/`.

## Admin area

Administrator screens share one shell, so every admin capability looks like the order queue:

- **Shell**: a header reading "Pet Store · ADMIN", then the admin nav, then the signed-in user name with an `ADMINISTRATOR` badge and Sign out. The page title and a one-line purpose sit under the header. Desktop, fixed width, like the rest of the product.
- **Access**: a visitor without the admin role sees the administrator sign-in page, not a blank or broken screen. A signed-in non-admin is told plainly that the account is not an administrator, and is offered sign-in as a different user.
- **Queues**: a queue is a `Table` under tabs, one tab per state, each labelled with its count. Only the tab whose rows can still change is editable; the others say they are read-only.

## Staged edits and confirmations

For work done in batches, where the user makes several decisions and saves them together:

- **Stage locally, save explicitly.** Each decision updates the row at once and marks it "staged". A bar above the table counts the staged changes, and the primary button names the batch ("Commit 3 decisions"). Nothing reaches the server until that button is used.
- **Confirm before anything irreversible or lossy.** Saving opens a `Dialog` that lists every change (`1001: PENDING → APPROVED`) and says whether the batch is all-or-nothing. Any action that would throw staged work away (refresh, leaving) opens a `Dialog` titled with the count ("Discard 3 uncommitted changes?"). Its safe choice keeps the work ("Cancel — keep my changes") and sits beside the destructive one. With nothing staged, no dialog appears.
- **Report the outcome in place.** Success shows an `Alert` with the count and reloads the data. Failure shows a destructive `Alert` quoting the server's message, says that nothing was saved, and leaves every staged change as it was.

Reference screens: the admin home, order review, commit and refresh-warning mockups under `artifacts/SWHR3-S-0003/design/`.

## Icons

`lucide-react` for general use, `@heroicons/react` for `@headlessui/react` overlays (nav dialog).

## Animation

`tw-animate-css` — Tailwind v4-compatible successor to `tailwindcss-animate`.
