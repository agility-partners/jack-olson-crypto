import { describe, expect, it } from "vitest";
import { formatPrice, pointsToSvgPath } from "./utils";

describe("formatPrice", () => {
  it("keeps four decimals for standard sub-dollar prices", () => {
    expect(formatPrice(0.1234)).toBe("$0.1234");
  });

  it("shows extra decimals for very small prices", () => {
    expect(formatPrice(0.0000132)).toBe("$0.0000132");
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
