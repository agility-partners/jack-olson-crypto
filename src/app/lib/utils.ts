export function formatPrice(n: number): string {
  if (n >= 1000) return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1)    return "$" + n.toFixed(2);
  return "$" + n.toFixed(4);
}
