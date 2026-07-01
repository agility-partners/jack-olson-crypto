import { describe, expect, it } from "vitest";
import { formatPrice, pointsToSvgPath } from "./utils";

describe("formatPrice", () => {
  it("uses 4 decimal places for sub-dollar prices above 0.09", () => {
    expect(formatPrice(0.1234)).toBe("$0.1234");
  });

  it("rounds sub-dollar prices above 0.09 to 4 decimal places", () => {
    expect(formatPrice(0.19936)).toBe("$0.1994");
  });

  it("keeps leading zeros for very small prices while truncating after the second non-zero digit", () => {
    expect(formatPrice(0.00000233)).toBe("$0.0000023");
  });

  it("keeps very small sub-dollar prices in truncation mode", () => {
    expect(formatPrice(0.00900099)).toBe("$0.0090009");
  });

  it("preserves zeros between the first two non-zero digits", () => {
    expect(formatPrice(0.1005)).toBe("$0.1005");
  });
});

describe("pointsToSvgPath", () => {
  it("returns null when fewer than 2 points are provided", () => {
    expect(pointsToSvgPath([])).toBeNull();
    expect(pointsToSvgPath([1])).toBeNull();
  });

  it("builds an upward sparkline path and trend flag", () => {
    const spark = pointsToSvgPath([100, 105, 110]);

    expect(spark).not.toBeNull();
    expect(spark!.up).toBe(true);
    expect(spark!.d.startsWith("M0.00,40.00")).toBe(true);
    expect(spark!.d.includes("L220.00,0.00")).toBe(true);
  });

  it("builds a downward sparkline trend flag", () => {
    const spark = pointsToSvgPath([110, 105, 100]);

    expect(spark).not.toBeNull();
    expect(spark!.up).toBe(false);
  });
});
