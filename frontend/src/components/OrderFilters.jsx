function OrderFilters({
  search,
  setSearch,
  paymentFilter,
  setPaymentFilter,
  fulfillmentFilter,
  setFulfillmentFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  updateFilter,
}) {
  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const handleSortChange = (e) => {
    const [field, direction] = e.target.value.split("-");

    updateFilter(() => {
      setSortBy(field);
      setSortOrder(direction);
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Search order or customer..."
          value={search}
          onChange={(e) => updateFilter(() => setSearch(e.target.value))}
          className={inputClass}
        />

        {/* Payment status */}
        <select
          value={paymentFilter}
          onChange={(e) => updateFilter(() => setPaymentFilter(e.target.value))}
          className={inputClass}
        >
          <option value="All">All Payments</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="REFUNDED">Refunded</option>
        </select>

        {/* Fulfillment status */}
        <select
          value={fulfillmentFilter}
          onChange={(e) =>
            updateFilter(() => setFulfillmentFilter(e.target.value))
          }
          className={inputClass}
        >
          <option value="All">All Fulfillment</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="UNFULFILLED">Unfulfilled</option>
        </select>

        {/* Sorting */}
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={handleSortChange}
          className={inputClass}
        >
          <option value="orderDate-desc">Newest first</option>
          <option value="orderDate-asc">Oldest first</option>
          <option value="totalAmount-desc">Highest amount</option>
          <option value="totalAmount-asc">Lowest amount</option>
        </select>
      </div>

      {/* Date range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            Start date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => updateFilter(() => setStartDate(e.target.value))}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => updateFilter(() => setEndDate(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}

export default OrderFilters;
