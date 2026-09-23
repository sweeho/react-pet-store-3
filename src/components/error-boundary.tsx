/**
 * Catches a render error anywhere under the router (design.md SD12 — the
 * React equivalent of MainServlet's jspException forward) and shows
 * RootErrorBoundary instead of a blank page. Logs the error exactly once
 * via componentDidCatch; src/main.tsx passes createRoot an `onCaughtError`
 * that does nothing, so React's own default double-log is suppressed and
 * this is the only console.error call.
 *
 * getDerivedStateFromError/componentDidCatch have no hook equivalent, so
 * this is a class component. "Resets when the location changes" (PLAN.md)
 * is done by remounting it via a `key` keyed to the pathname, in the
 * wrapping function component below — a fresh instance starts with no
 * caught error.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router";

import RootErrorBoundary from "@/pages/RootErrorBoundary";

interface AppErrorBoundaryInnerProps {
  children: ReactNode;
}

interface AppErrorBoundaryInnerState {
  error: unknown;
  hasError: boolean;
}

class AppErrorBoundaryInner extends Component<
  AppErrorBoundaryInnerProps,
  AppErrorBoundaryInnerState
> {
  state: AppErrorBoundaryInnerState = { error: undefined, hasError: false };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryInnerState {
    return { error, hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    console.error(error, errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <RootErrorBoundary error={this.state.error} />;
    }
    return this.props.children;
  }
}

export interface AppErrorBoundaryProps {
  children: ReactNode;
}

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  const location = useLocation();
  return <AppErrorBoundaryInner key={location.pathname}>{children}</AppErrorBoundaryInner>;
}
