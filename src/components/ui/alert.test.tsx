import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Alert, AlertDescription, AlertTitle } from "./alert";

/**
 * UI / COMPONENT TEST
 */
describe("Alert", () => {
  it("renders the default variant with a title and description", () => {
    render(
      <Alert>
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Something to know.</AlertDescription>
      </Alert>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Heads up")).toBeInTheDocument();
    expect(screen.getByText("Something to know.")).toBeInTheDocument();
  });

  it("applies the destructive variant classes", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>That user name is already taken</AlertTitle>
        <AlertDescription>Choose a different one.</AlertDescription>
      </Alert>,
    );

    expect(screen.getByRole("alert")).toHaveClass("border-destructive/35");
  });
});
