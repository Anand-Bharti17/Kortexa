/** Storefront currency — must match Razorpay (`INR`) on the backend. */
export const STORE_CURRENCY = "INR";

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: STORE_CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format numeric amounts for display (major units, e.g. rupees not paise). */
export function formatPrice(amount) {
  const value = Number.parseFloat(amount);
  if (Number.isNaN(value)) {
    return priceFormatter.format(0);
  }
  return priceFormatter.format(value);
}
