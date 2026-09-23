import "./index.css";

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router";
import routes from "~react-pages";

import { RequireAuth } from "@/components/auth/require-auth";
import { AppErrorBoundary } from "@/components/error-boundary";

// eslint-disable-next-line react-refresh/only-export-components
function App() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<p>...</p>}>
        <RequireAuth>{useRoutes(routes)}</RequireAuth>
      </Suspense>
    </AppErrorBoundary>
  );
}

// AppErrorBoundary's componentDidCatch is the single log point for a
// caught render error (design.md AC-5) — this no-op onCaughtError
// suppresses React's own default console.error for errors an error
// boundary already caught, so the error isn't logged twice.
const app = createRoot(document.getElementById("root")!, { onCaughtError: () => {} });

app.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
