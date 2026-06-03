/** Format numeric amounts as USD for display. */
export function formatPrice(amount) {
  const value = Number.parseFloat(amount);
  if (Number.isNaN(value)) return "$0.00";
  return `$${value.toFixed(2)}`;
}
