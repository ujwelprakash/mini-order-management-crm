import StatusBadge from "./StatusBadge";
import formatCurrency from "../utils/formatCurrency";
import formatDate from "../utils/formatDate";

function OrderTable({
  orders = [],
  loading = false,
  error = "",
  onRetry,
  onViewOrder,
  showViewButton = true,
}) {
  if (loading) {
    return (
      <div className="py-16 text-center text-slate-500 dark:text-slate-400">
        Loading orders...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-600">{error}</p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full whitespace-nowrap text-left">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <tr>
            <th className="px-6 py-4">Order</th>
            <th className="px-6 py-4">Customer</th>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Payment</th>
            <th className="px-6 py-4">Fulfillment</th>

            {showViewButton && <th className="px-6 py-4">Action</th>}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {orders.length > 0 ? (
            orders.map((order) => (
              <tr
                key={order.id}
                className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                  {order.orderNumber || `#${order.id}`}
                </td>

                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {order.customerName ||
                      order.customer?.name ||
                      "Guest customer"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {order.customerEmail || order.customer?.email || "No email"}
                  </p>
                </td>

                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                  {formatDate(order.orderDate)}
                </td>

                <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(order.totalAmount, order.currency || "USD")}
                </td>

                <td className="px-6 py-4">
                  <StatusBadge status={order.financialStatus} />
                </td>

                <td className="px-6 py-4">
                  <StatusBadge status={order.fulfillmentStatus} />
                </td>

                {showViewButton && (
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => onViewOrder?.(order.id)}
                      disabled={!order.id || !onViewOrder}
                      className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-blue-900/20"
                    >
                      View
                    </button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={showViewButton ? 7 : 6}
                className="py-16 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                No orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default OrderTable;
