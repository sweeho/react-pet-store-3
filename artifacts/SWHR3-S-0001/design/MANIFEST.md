# Design manifest — SWHR3-S-0001

Idea **SWHR3-I-0002** (Customer Management and Authentication), canvas doc version **22** (frozen). Exported byte-exact from the idea's design blocks; each file's sha256 matches the export record.

Mockups are the build target, drawn at 1440 px wide with the existing shadcn neutral tokens of `src/index.css` and no new tokens. Wireframes give structure only.

| File                                                                       | Variant   | Screen             | Used by                                  |
| -------------------------------------------------------------------------- | --------- | ------------------ | ---------------------------------------- |
| [`wireframe-sign-on.html`](./wireframe-sign-on.html)                       | wireframe | sign-on            | SWHR3-T-0007, SWHR3-T-0008, SWHR3-T-0021 |
| [`wireframe-sign-on-error.html`](./wireframe-sign-on-error.html)           | wireframe | sign-on-error      | SWHR3-T-0009                             |
| [`wireframe-create-customer.html`](./wireframe-create-customer.html)       | wireframe | create-customer    | SWHR3-T-0014, SWHR3-T-0021               |
| [`wireframe-registration-error.html`](./wireframe-registration-error.html) | wireframe | registration-error | SWHR3-T-0008                             |
| [`wireframe-error-screen.html`](./wireframe-error-screen.html)             | wireframe | error-screen       | SWHR3-T-0019                             |
| [`wireframe-account-profile.html`](./wireframe-account-profile.html)       | wireframe | account-profile    | SWHR3-T-0015                             |
| [`mockup-sign-on.html`](./mockup-sign-on.html)                             | mockup    | sign-on            | SWHR3-T-0007, SWHR3-T-0008, SWHR3-T-0021 |
| [`mockup-sign-on-error.html`](./mockup-sign-on-error.html)                 | mockup    | sign-on-error      | SWHR3-T-0009                             |
| [`mockup-create-customer.html`](./mockup-create-customer.html)             | mockup    | create-customer    | SWHR3-T-0014, SWHR3-T-0021               |
| [`mockup-registration-error.html`](./mockup-registration-error.html)       | mockup    | registration-error | SWHR3-T-0008                             |
| [`mockup-error-screen.html`](./mockup-error-screen.html)                   | mockup    | error-screen       | SWHR3-T-0019                             |
| [`mockup-account-profile.html`](./mockup-account-profile.html)             | mockup    | account-profile    | SWHR3-T-0015                             |

The top bar and category strip in every mockup are the storefront shell, which belongs to catalog browsing (`swhr3-i-0009`). This sprint builds the page bodies only.
