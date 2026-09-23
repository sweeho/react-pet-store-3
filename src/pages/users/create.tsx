/**
 * /users/create (design.md D14): the create-customer page of
 * mockup-create-customer.html — the page body only, not the storefront
 * topbar/catnav/footer shell (MANIFEST.md: that belongs to swhr3-i-0009).
 * The signed-in user name (GET /api/session) is read-only. Every field is
 * required except the second address line (AC-5); Card type, Expiry month,
 * Expiry year, Preferred language and Favourite category are Selects, per
 * the PLAN — State/Province and Country stay plain text since neither is
 * backed by an enum in the data model (lib/customer-profile.ts).
 */
import type { FormEvent } from "react";

import { Button, Checkbox, FormField, Input, Select } from "@/components/ui";
import { PROFILE_PATH } from "@/constants/auth";
import { CARD_TYPES, FAVORITE_CATEGORIES, LOCALES } from "@/types/customer-profile";
import type { CustomerProfileInput } from "@/types/customer-profile";
import { ApiError, apiFetch } from "@/utils/api";

interface SubmitError {
  message: string;
  fieldErrors?: Record<string, string>;
}

const CURRENT_YEAR = new Date().getFullYear();
const EXPIRY_MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const EXPIRY_YEARS = Array.from({ length: 16 }, (_, index) => CURRENT_YEAR + index);

function emptyForm(): CustomerProfileInput {
  return {
    firstName: "",
    lastName: "",
    email: "",
    telephone: "",
    address: { street1: "", street2: "", city: "", state: "", postalCode: "", country: "" },
    card: {
      cardType: CARD_TYPES[0],
      cardNumber: "",
      expiryMonth: new Date().getMonth() + 1,
      expiryYear: CURRENT_YEAR,
    },
    preferences: {
      locale: LOCALES[0],
      favoriteCategory: null,
      myListEnabled: false,
      petTipsEnabled: false,
    },
  };
}

export default function CreateCustomer() {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerProfileInput>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<{ user: { id: number; username: string } | null }>("/api/session").then(({ user }) => {
      if (!cancelled) {
        setUsername(user?.username ?? null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (field: "firstName" | "lastName" | "email" | "telephone", value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateAddress = (field: keyof CustomerProfileInput["address"], value: string) => {
    setForm((current) => ({ ...current, address: { ...current.address, [field]: value } }));
  };

  const updateCard = (field: keyof CustomerProfileInput["card"], value: string | number) => {
    setForm((current) => ({ ...current, card: { ...current.card, [field]: value } }));
  };

  const updatePreferences = <K extends keyof CustomerProfileInput["preferences"]>(
    field: K,
    value: CustomerProfileInput["preferences"][K],
  ) => {
    setForm((current) => ({
      ...current,
      preferences: { ...current.preferences, [field]: value },
    }));
  };

  const handleCancel = () => {
    setForm(emptyForm());
    setSubmitError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    apiFetch("/api/customers", { method: "POST", body: form })
      .then(() => {
        navigate(PROFILE_PATH);
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError) {
          setSubmitError({
            message: error.message,
            // DuplicateEmailError has no data.fieldErrors of its own (it
            // isn't a ValidationError) — AC-4 wants it shown under Email.
            fieldErrors:
              error.code === "DUPLICATE_EMAIL"
                ? { ...error.fieldErrors, email: error.message }
                : error.fieldErrors,
          });
        } else {
          setSubmitError({ message: "Something went wrong creating your account." });
        }
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div className="bg-muted min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Create your account</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            All fields are required except the second address line.
          </p>
        </div>

        <div className="border-border bg-background flex flex-wrap items-center gap-3 rounded-lg border p-4 text-sm shadow-sm">
          <span>
            User name <strong className="font-semibold">{username}</strong>
          </span>
          <span className="text-muted-foreground ml-auto text-xs">
            Chosen on the previous step. It can&rsquo;t be changed later.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <section className="border-border bg-background space-y-4 rounded-lg border p-6 shadow-sm">
              <div>
                <h2 className="text-base font-semibold">Contact information</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Used for your order confirmation emails and as the default address at checkout.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="First name" error={submitError?.fieldErrors?.firstName}>
                  <Input
                    value={form.firstName}
                    onChange={(event) => updateField("firstName", event.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Last name" error={submitError?.fieldErrors?.lastName}>
                  <Input
                    value={form.lastName}
                    onChange={(event) => updateField("lastName", event.target.value)}
                    required
                  />
                </FormField>
              </div>
              <FormField
                label="Street address"
                error={submitError?.fieldErrors?.["address.street1"]}
              >
                <Input
                  value={form.address.street1}
                  onChange={(event) => updateAddress("street1", event.target.value)}
                  required
                />
              </FormField>
              <FormField label="Street address line 2 (optional)">
                <Input
                  value={form.address.street2 ?? ""}
                  onChange={(event) => updateAddress("street2", event.target.value)}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="City" error={submitError?.fieldErrors?.["address.city"]}>
                  <Input
                    value={form.address.city}
                    onChange={(event) => updateAddress("city", event.target.value)}
                    required
                  />
                </FormField>
                <FormField
                  label="State / Province"
                  error={submitError?.fieldErrors?.["address.state"]}
                >
                  <Input
                    value={form.address.state}
                    onChange={(event) => updateAddress("state", event.target.value)}
                    required
                  />
                </FormField>
                <FormField
                  label="ZIP / Postal code"
                  error={submitError?.fieldErrors?.["address.postalCode"]}
                >
                  <Input
                    value={form.address.postalCode}
                    onChange={(event) => updateAddress("postalCode", event.target.value)}
                    required
                  />
                </FormField>
              </div>
              <FormField label="Country" error={submitError?.fieldErrors?.["address.country"]}>
                <Input
                  value={form.address.country}
                  onChange={(event) => updateAddress("country", event.target.value)}
                  required
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Telephone" error={submitError?.fieldErrors?.telephone}>
                  <Input
                    value={form.telephone}
                    onChange={(event) => updateField("telephone", event.target.value)}
                    required
                  />
                </FormField>
                <FormField
                  label="Email"
                  helperText="Order confirmations and approval updates are sent here."
                  error={submitError?.fieldErrors?.email}
                >
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    required
                  />
                </FormField>
              </div>
            </section>

            <div className="space-y-6">
              <section className="border-border bg-background space-y-4 rounded-lg border p-6 shadow-sm">
                <div>
                  <h2 className="text-base font-semibold">Credit card</h2>
                  <p className="text-muted-foreground mt-1 text-xs">
                    One card is kept on your account and shown back to you at checkout. It
                    isn&rsquo;t charged online.
                  </p>
                </div>
                <FormField label="Card type">
                  <Select
                    value={form.card.cardType}
                    onChange={(event) =>
                      updateCard(
                        "cardType",
                        event.target.value as CustomerProfileInput["card"]["cardType"],
                      )
                    }
                    required
                  >
                    {CARD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField
                  label="Card number"
                  error={submitError?.fieldErrors?.["card.cardNumber"]}
                >
                  <Input
                    value={form.card.cardNumber}
                    onChange={(event) => updateCard("cardNumber", event.target.value)}
                    required
                  />
                </FormField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Expiry month"
                    error={submitError?.fieldErrors?.["card.expiryMonth"]}
                  >
                    <Select
                      value={form.card.expiryMonth}
                      onChange={(event) => updateCard("expiryMonth", Number(event.target.value))}
                      required
                    >
                      {EXPIRY_MONTHS.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField
                    label="Expiry year"
                    error={submitError?.fieldErrors?.["card.expiryYear"]}
                  >
                    <Select
                      value={form.card.expiryYear}
                      onChange={(event) => updateCard("expiryYear", Number(event.target.value))}
                      required
                    >
                      {EXPIRY_YEARS.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
              </section>

              <section className="border-border bg-background space-y-4 rounded-lg border p-6 shadow-sm">
                <div>
                  <h2 className="text-base font-semibold">Profile</h2>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Sets the language you see and what the home page shows you.
                  </p>
                </div>
                <FormField label="Preferred language">
                  <Select
                    value={form.preferences.locale}
                    onChange={(event) =>
                      updatePreferences(
                        "locale",
                        event.target.value as CustomerProfileInput["preferences"]["locale"],
                      )
                    }
                    required
                  >
                    {LOCALES.map((locale) => (
                      <option key={locale} value={locale}>
                        {locale}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Favourite category">
                  <Select
                    value={form.preferences.favoriteCategory ?? ""}
                    onChange={(event) =>
                      updatePreferences(
                        "favoriteCategory",
                        event.target
                          .value as CustomerProfileInput["preferences"]["favoriteCategory"],
                      )
                    }
                    required
                  >
                    <option value="" disabled>
                      Select a category
                    </option>
                    {FAVORITE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <Checkbox
                  label="Show MyList on the home page"
                  helperText="Up to ten products from your favourite category."
                  checked={form.preferences.myListEnabled}
                  onChange={(event) => updatePreferences("myListEnabled", event.target.checked)}
                />
                <Checkbox
                  label="Show pet tips banners"
                  helperText="Care advice across the top of the store."
                  checked={form.preferences.petTipsEnabled}
                  onChange={(event) => updatePreferences("petTipsEnabled", event.target.checked)}
                />
              </section>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
