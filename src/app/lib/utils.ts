export function formatPrice(n: number): string {
  const abs = Math.abs(n);

  if (abs >= 1000) return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (abs >= 1)    return "$" + n.toFixed(2);
  if (abs > 0.01)  return `${n < 0 ? "-$" : "$"}${abs.toFixed(4)}`;
  if (abs === 0)   return "$0.00";

  const sign = n < 0 ? "-$" : "$";
  const decimals = abs.toFixed(20).split(".")[1] ?? "";
  let endIndex = -1;
  let nonZeroCount = 0;

  for (let i = 0; i < decimals.length; i += 1) {
    if (decimals[i] !== "0") {
      nonZeroCount += 1;
      endIndex = i;

      if (nonZeroCount === 2) {
        break;
      }
    }
  }

  if (endIndex === -1) {
    return "$0.00";
  }

  return `${sign}0.${decimals.slice(0, endIndex + 1)}`;
}

export function formatSupply(raw: number, symbol: string): string {
  const abs = Math.abs(raw);
  let formatted: string;
  if (abs >= 1_000_000_000) {
    formatted = (abs / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 }) + "B";
  } else if (abs >= 1_000_000) {
    formatted = (abs / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 }) + "M";
  } else if (abs >= 1_000) {
    formatted = (abs / 1_000).toLocaleString("en-US", { maximumFractionDigits: 2 }) + "K";
  } else {
    formatted = abs.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return `${formatted} ${symbol}`;
}

type SparkPathData = {
  d: string;
  up: boolean;
};

export function pointsToSvgPath(prices: number[]): SparkPathData | null {
  if (!Array.isArray(prices) || prices.length < 2) {
    return null;
  }

  const values = prices.filter((p) => Number.isFinite(p));
  if (values.length < 2) {
    return null;
  }

  const width = 220;
  const height = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const lastIndex = values.length - 1;

  const d = values
    .map((value, index) => {
      const x = (index / lastIndex) * width;
      const y = height - ((value - min) / range) * height;
      const cmd = index === 0 ? "M" : "L";
      return `${cmd}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return {
    d,
    up: values[lastIndex] >= values[0],
  };
}
