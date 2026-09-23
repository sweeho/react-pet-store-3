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

Inventory: `Button`, `Input`, `Label`, `Checkbox`, `Select`, `Alert`, `FormField`.

## Forms

Every form is built from the same pieces, so later forms (checkout, admin) look and behave like the first ones.

- **Field**: `FormField` stacks a `Label`, the control, optional helper text in `text-muted-foreground`, and an error line in `text-destructive`. The error is linked to the control with `aria-invalid` and `aria-describedby`, so a screen reader reads it with the field.
- **Controls**: native elements styled with tokens only. `Input` and `Select` have a `border-input` border, `rounded-md` corners and a `--ring` focus outline. `Checkbox` pairs its box with a label and a one-line helper.
- **Required and optional**: required is the default and is enforced by the browser (`required`, `maxLength`) before anything is sent. The one optional field is labelled "(optional)" rather than marking every required field.
- **Two layers of errors**:
  - A problem with one field shows under that field, and the form keeps every value the user typed.
  - A problem with the whole submission (wrong credentials, a taken user name) shows as an `Alert` (`destructive`, `role="alert"`) above the fields it concerns: above both panels when it applies to the page, inside a panel when it applies only to that panel.
- **Sensitive fields**: a failed sign-in clears the password and keeps the user name. A stored card number is never shown back; it appears as `•••• 1234`, and typing a new number replaces it.
- **Read-only facts**: something the user cannot change, such as the user name after registration, is shown as text with a one-line explanation, not as a disabled input.
- **Actions**: the primary action (`Button` default variant) ends the form on the right, with the secondary action (`outline`) beside it.

Reference screens: the sign-in, create-account and account-profile mockups under `artifacts/SWHR3-S-0001/design/`.

## Icons

`lucide-react` for general use, `@heroicons/react` for `@headlessui/react` overlays (nav dialog).

## Animation

`tw-animate-css` — Tailwind v4-compatible successor to `tailwindcss-animate`.
