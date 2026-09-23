/**
 * The single error screen every caught error renders (design.md
 * mockup-error-screen.html, SD12). Rendered by AppErrorBoundary for a
 * render error caught anywhere under the router. The top bar, category nav
 * and footer in the mockup belong to the storefront shell (swhr3-i-0009)
 * and are out of scope this sprint — only the page body is built.
 */
import { Link } from "react-router";

import { Button } from "@/components/ui";
import { getErrorScreen } from "@/utils/error-screen";

export interface RootErrorBoundaryProps {
  error?: unknown;
}

const RootErrorBoundary = ({ error }: RootErrorBoundaryProps) => {
  const { message } = getErrorScreen(error);

  return (
    <div className="bg-muted flex min-h-screen items-center justify-center p-6">
      <section className="bg-card w-full max-w-lg rounded-lg border p-9 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed">
          The store hit an unexpected problem while handling your request. Nothing you entered has
          been saved, and no order was placed.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Button asChild>
            <Link to="/">Back to the store</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/signin">Sign in again</Link>
          </Button>
        </div>
        <details className="mt-7 text-left" open>
          <summary className="text-muted-foreground flex cursor-pointer list-none items-center justify-center gap-1.5 text-xs">
            Technical detail
          </summary>
          <div className="bg-muted mt-3 rounded-md border p-3 font-mono text-xs leading-relaxed break-words">
            {message}
          </div>
        </details>
      </section>
    </div>
  );
};

export default RootErrorBoundary;
