/**
 * /users/profile (design.md D14): the account-profile page of
 * mockup-account-profile.html — the page body only, not the storefront
 * topbar/catnav/footer shell (MANIFEST.md: that belongs to swhr3-i-0009).
 * The user name is read-only; contact, card and profile sections are
 * editable. A 404 on load means the account has no profile yet, so the
 * visitor is sent to /users/create (SWHR3-T-0014); any other load failure
 * is thrown during render so the app error boundary shows it.
 */
import type { FormEvent } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  FormField,
  Input,
  Select,
} from "@/components/ui";
import { CREATE_ACCOUNT_PATH } from "@/constants/auth";
import { CARD_TYPES, FAVORITE_CATEGORIES, LOCALES } from "@/types/customer-profile";
import type { CustomerProfile, CustomerProfileInput } from "@/types/customer-profile";
import { ApiError, apiFetch } from "@/utils/api";

interface SaveError {
  message: string;
  fieldErrors?: Record<string, string>;
}

function toFormState(profile: CustomerProfile): CustomerProfileInput {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    telephone: profile.telephone,
    address: { ...profile.address },
    card: {
      cardType: profile.card.cardType,
      // The real number never leaves the server (D9) — a blank field keeps
      // the card on file; typing a new one replaces it.
      cardNumber: "",
      expiryMonth: profile.card.expiryMonth,
      expiryYear: profile.card.expiryYear,
    },
    preferences: { ...profile.preferences },
  };
}

export default function UserProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [form, setForm] = useState<CustomerProfileInput | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<SaveError | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<{ customer: CustomerProfile }>("/api/customers/me")
      .then(({ customer }) => {
        if (cancelled) {
          return;
        }
        setProfile(customer);
        setForm(toFormState(customer));
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          navigate(CREATE_ACCOUNT_PATH);
          return;
        }
        setLoadError(error);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Thrown during render, not inside the effect above, so the nearest
  // error boundary catches it (an effect's throw is invisible to React).
  if (loadError) {
    throw loadError;
  }

  if (!profile || !form) {
    return <p className="text-muted-foreground p-8 text-sm">Loading your account…</p>;
  }

  const updateField = (field: "firstName" | "lastName" | "email" | "telephone", value: string) => {
    setForm((current) => current && { ...current, [field]: value });
  };

  const updateAddress = (field: keyof CustomerProfileInput["address"], value: string | null) => {
    setForm(
      (current) => current && { ...current, address: { ...current.address, [field]: value } },
    );
  };

  const updateCard = (field: keyof CustomerProfileInput["card"], value: string | number) => {
    setForm((current) => current && { ...current, card: { ...current.card, [field]: value } });
  };

  const updatePreferences = <K extends keyof CustomerProfileInput["preferences"]>(
    field: K,
    value: CustomerProfileInput["preferences"][K],
  ) => {
    setForm(
      (current) =>
        current && { ...current, preferences: { ...current.preferences, [field]: value } },
    );
  };

  const handleCancel = () => {
    setForm(toFormState(profile));
    setSaveError(null);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);

    apiFetch<{ customer: CustomerProfile }>("/api/customers/me", { method: "PUT", body: form })
      .then(({ customer }) => {
        setProfile(customer);
        setForm(toFormState(customer));
      })
      .catch((error: unknown) => {
        setSaveError({
          message:
            error instanceof ApiError ? error.message : "Something went wrong saving your changes.",
          fieldErrors: error instanceof ApiError ? error.fieldErrors : undefined,
        });
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <div className="bg-muted min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your account</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Update your contact details, saved card and store preferences.
            </p>
          </div>
          <SignOutButton />
        </div>

        <div className="border-border bg-background flex flex-wrap items-center gap-3 rounded-lg border p-4 text-sm shadow-sm">
          <span>
            User name <strong className="font-semibold">{profile.username}</strong>
          </span>
          <span className="text-muted-foreground ml-auto text-xs">
            Your user name and password can&rsquo;t be changed here.
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {saveError && (
            <Alert variant="destructive">
              <AlertTitle>Couldn&rsquo;t save your changes</AlertTitle>
              <AlertDescription>{saveError.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <section className="border-border bg-background space-y-4 rounded-lg border p-6 shadow-sm">
              <div>
                <h2 className="text-base font-semibold">Contact information</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Used for your order confirmation emails and as the default address at checkout.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="First name" error={saveError?.fieldErrors?.firstName}>
                  <Input
                    value={form.firstName}
                    onChange={(event) => updateField("firstName", event.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Last name" error={saveError?.fieldErrors?.lastName}>
                  <Input
                    value={form.lastName}
                    onChange={(event) => updateField("lastName", event.target.value)}
                    required
                  />
                </FormField>
              </div>
              <FormField label="Street address" error={saveError?.fieldErrors?.["address.street1"]}>
                <Input
                  value={form.address.street1}
                  onChange={(event) => updateAddress("street1", event.target.value)}
                  required
                />
              </FormField>
              <FormField label="Street address line 2 (optional)">
                <Input
                  value={form.address.street2 ?? ""}
                  onChange={(event) => updateAddress("street2", event.target.value || null)}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="City" error={saveError?.fieldErrors?.["address.city"]}>
                  <Input
                    value={form.address.city}
                    onChange={(event) => updateAddress("city", event.target.value)}
                    required
                  />
                </FormField>
                <FormField
                  label="State / Province"
                  error={saveError?.fieldErrors?.["address.state"]}
                >
                  <Input
                    value={form.address.state}
                    onChange={(event) => updateAddress("state", event.target.value)}
                    required
                  />
                </FormField>
                <FormField
                  label="ZIP / Postal code"
                  error={saveError?.fieldErrors?.["address.postalCode"]}
                >
                  <Input
                    value={form.address.postalCode}
                    onChange={(event) => updateAddress("postalCode", event.target.value)}
                    required
                  />
                </FormField>
              </div>
              <FormField label="Country" error={saveError?.fieldErrors?.["address.country"]}>
                <Input
                  value={form.address.country}
                  onChange={(event) => updateAddress("country", event.target.value)}
                  required
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Telephone" error={saveError?.fieldErrors?.telephone}>
                  <Input
                    value={form.telephone}
                    onChange={(event) => updateField("telephone", event.target.value)}
                    required
                  />
                </FormField>
                <FormField
                  label="Email"
                  helperText="Order confirmations and approval updates are sent here."
                  error={saveError?.fieldErrors?.email}
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
                  helperText={`Currently ending in ${profile.card.cardNumberLast4}. Enter a new number to replace the card on file.`}
                  error={saveError?.fieldErrors?.["card.cardNumber"]}
                >
                  <Input
                    placeholder={`•••• •••• •••• ${profile.card.cardNumberLast4}`}
                    value={form.card.cardNumber}
                    onChange={(event) => updateCard("cardNumber", event.target.value)}
                  />
                </FormField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Expiry month"
                    error={saveError?.fieldErrors?.["card.expiryMonth"]}
                  >
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={form.card.expiryMonth}
                      onChange={(event) => updateCard("expiryMonth", Number(event.target.value))}
                    />
                  </FormField>
                  <FormField
                    label="Expiry year"
                    error={saveError?.fieldErrors?.["card.expiryYear"]}
                  >
                    <Input
                      type="number"
                      value={form.card.expiryYear}
                      onChange={(event) => updateCard("expiryYear", Number(event.target.value))}
                    />
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
                        (event.target.value ||
                          null) as CustomerProfileInput["preferences"]["favoriteCategory"],
                      )
                    }
                  >
                    <option value="">None</option>
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
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
