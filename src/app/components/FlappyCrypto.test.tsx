import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import FlappyCrypto from "./FlappyCrypto";

describe("FlappyCrypto", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows a default high score of 0", async () => {
    render(<FlappyCrypto />);

    await waitFor(() => {
      expect(screen.getByText("High Score: 0")).toBeInTheDocument();
    });
  });

  it("shows the saved high score from localStorage", async () => {
    localStorage.setItem("flappyCryptoTopScore", "17");
    render(<FlappyCrypto />);

    await waitFor(() => {
      expect(screen.getByText("High Score: 17")).toBeInTheDocument();
    });
  });
});
