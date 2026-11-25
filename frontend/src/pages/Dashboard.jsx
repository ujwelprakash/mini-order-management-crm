import { useCallback, useEffect, useState } from "react";

import OrderTable from "../components/OrderTable";
import { apiRequest } from "../services/api";

function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [ordersResponse, statsResponse] = await Promise.all([
        apiRequest("/orders?page=1&limit=5&sortBy=orderDate&sortOrder=desc"),
        apiRequest("/orders/stats"),
      ]);

      setOrders(ordersResponse.orders || []);
      setStatsData(statsResponse);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
      setOrders([]);
      setStatsData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const stats = [
    {
      title: "Total Orders",
      value: statsData?.totalOrders ?? 0,
      description: "All orders",
    },
    {
      title: "Paid Orders",
      value: statsData?.paidOrders ?? 0,
      description: "Across all orders",
    },
    {
      title: "Pending Payments",
      value: statsData?.pendingOrders ?? 0,
      description: "Across all orders",
    },
    {
      title: "Fulfilled Orders",
      value: statsData?.fulfilledOrders ?? 0,
      description: "Across all orders",
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
            Overview of your Shopify orders.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboard}
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
            onClick={fetchDashboard}
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
            Your latest 5 Shopify orders.
          </p>
        </div>

        <OrderTable
          orders={orders}
          loading={loading}
          error={error}
          onRetry={fetchDashboard}
          showViewButton={false}
        />
      </div>
    </div>
  );
}

export default Dashboard;
