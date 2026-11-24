function StatusBadge({ status = "unknown", type = "payment" }) {
  const normalizedStatus = String(status).toLowerCase();

  const styles = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    refunded: "bg-red-100 text-red-700",
    partially_refunded: "bg-orange-100 text-orange-700",
    fulfilled: "bg-green-100 text-green-700",
    unfulfilled: "bg-yellow-100 text-yellow-700",
    partial: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
    unknown: "bg-slate-100 text-slate-600",
  };

  const label = normalizedStatus.replaceAll("_", " ");

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${
        styles[normalizedStatus] || styles.unknown
      }`}
      data-status-type={type}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
