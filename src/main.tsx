import "./index.css";

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router";
import routes from "~react-pages";

import { RequireAuth } from "@/components/auth/require-auth";

// eslint-disable-next-line react-refresh/only-export-components
function App() {
  return (
    <Suspense fallback={<p>...</p>}>
      <RequireAuth>{useRoutes(routes)}</RequireAuth>
    </Suspense>
  );
}

const app = createRoot(document.getElementById("root")!);

app.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
