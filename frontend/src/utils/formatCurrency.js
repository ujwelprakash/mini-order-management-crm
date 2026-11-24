function formatCurrency(amount, currency = "USD") {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(0);
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export default formatCurrency;
