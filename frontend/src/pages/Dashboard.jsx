import { useCallback, useEffect, useState } from "react";

import OrderTable from "../components/OrderTable";
import { apiRequest } from "../services/api";
import formatCurrency from "../utils/formatCurrency";
import formatDate from "../utils/formatDate";

function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRecentOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest(
        "/orders?page=1&limit=5&sortBy=orderDate&sortOrder=desc",
      );

      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentOrders();
  }, [fetchRecentOrders]);

  const paidOrders = orders.filter(
    (order) => order.financialStatus?.toUpperCase() === "PAID",
  ).length;

  const pendingOrders = orders.filter(
    (order) => order.financialStatus?.toUpperCase() === "PENDING",
  ).length;

  const fulfilledOrders = orders.filter(
    (order) => order.fulfillmentStatus?.toUpperCase() === "FULFILLED",
  ).length;

  const stats = [
    {
      title: "Recent Orders",
      value: orders.length,
      description: "Latest 5 orders",
    },
    {
      title: "Paid Orders",
      value: paidOrders,
      description: "In the latest 5 orders",
    },
    {
      title: "Pending Payments",
      value: pendingOrders,
      description: "In the latest 5 orders",
    },
    {
      title: "Fulfilled Orders",
      value: fulfilledOrders,
      description: "In the latest 5 orders",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Overview of your recent Shopify orders.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRecentOrders}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex flex-col gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400 sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>

          <button
            type="button"
            onClick={fetchRecentOrders}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {stat.title}
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
              {loading ? "..." : stat.value}
            </p>

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Orders
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your latest Shopify orders.
          </p>
        </div>

        <OrderTable
          orders={orders}
          loading={loading}
          error={error}
          onRetry={fetchRecentOrders}
          onViewOrder={() => {}}
        />
      </div>
    </div>
  );
}

export default Dashboard;
