import { describe, expect, it } from "vitest";
import { formatPrice, pointsToSvgPath } from "./utils";

describe("formatPrice", () => {
  it("truncates standard sub-dollar prices after the first two non-zero digits", () => {
    expect(formatPrice(0.1234)).toBe("$0.12");
  });

  it("keeps leading zeros for very small prices while truncating after the second non-zero digit", () => {
    expect(formatPrice(0.00000233)).toBe("$0.0000023");
  });

  it("truncates sub-dollar prices instead of rounding them up", () => {
    expect(formatPrice(0.998944)).toBe("$0.99");
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
