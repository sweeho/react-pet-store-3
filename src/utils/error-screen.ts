/**
 * Maps a caught error to a screen (design.md C16, SD12 — the React
 * equivalent of MainServlet's jspException forward and
 * ScreenFlowManager.getExceptionScreen()).
 */
import { ApiError } from "./api";

export interface ErrorScreen {
  screen: "signin" | "error";
  message: string;
}

const DUPLICATE_ACCOUNT_MESSAGE = "That user name is already taken";

export function getErrorScreen(error: unknown): ErrorScreen {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return { screen: "signin", message: error.message };
    }
    if (error.code === "DUPLICATE_ACCOUNT") {
      return { screen: "error", message: DUPLICATE_ACCOUNT_MESSAGE };
    }
    return { screen: "error", message: error.message };
  }

  if (error instanceof Error) {
    return { screen: "error", message: error.message };
  }

  return { screen: "error", message: "An unexpected error occurred" };
}
