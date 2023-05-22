export const mileageReimbursementRate = 0.22;

export const EURFormat = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
});

export const KMFormat = new Intl.NumberFormat("fi-FI", {
  style: "unit",
  unit: "kilometer",
});
