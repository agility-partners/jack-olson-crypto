export function formatPrice(n: number): string {
  if (n >= 1000) return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1)    return "$" + n.toFixed(2);
  return "$" + n.toFixed(4);
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
