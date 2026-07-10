import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AddCoinModal from "./AddCoinModal";
import { watchlistCoins } from "@/app/lib/mockData";

describe("AddCoinModal", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({}), { status: 201 })),
    ));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows selecting and adding up to 10 coins at once", async () => {
    render(
      <AddCoinModal
        onClose={vi.fn()}
        onAddCoin={vi.fn()}
        currentCoins={watchlistCoins.slice(0, 4)}
        allCoins={watchlistCoins}
      />,
    );

    const coinOptions = screen.getAllByRole("option");
    const firstTenOptions = coinOptions.slice(0, 10);

    firstTenOptions.forEach((option) => {
      fireEvent.click(option);
    });

    expect(screen.getByText("10 / 10 selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to Watchlist (10)" })).toBeInTheDocument();
    expect(coinOptions[10]).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Add to Watchlist (10)" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(10);
    });
  });
});
