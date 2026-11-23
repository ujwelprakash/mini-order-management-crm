import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000";
const PAGE_SIZE = 5;

const inputClass =
  "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500";

function StatusBadge({ status }) {
  const value = status?.toUpperCase();

  const styles = {
    PAID: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    REFUNDED: "bg-red-100 text-red-700",
    FULFILLED: "bg-blue-100 text-blue-700",
    UNFULFILLED: "bg-orange-100 text-orange-700",
    PARTIALLY_FULFILLED: "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${styles[value] || "bg-gray-100 text-gray-600"}`}
    >
      {value ? value.replaceAll("_", " ") : "N/A"}
    </span>
  );
}

function App() {
  // Authentication state is stored locally so the user stays signed in after refresh.
  const [token, setToken] = useState(
    () => localStorage.getItem("accessToken") || "",
  );
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("authUser") || "null");
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Attach the JWT to every protected backend request.
  async function authorizedFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async function handleAuthentication(e) {
    e.preventDefault();
    setAuthError("");

    if (authMode === "register" && !authName.trim()) {
      setAuthError("Please enter your name.");
      return;
    }

    try {
      setAuthLoading(true);
      const payload =
        authMode === "register"
          ? {
              name: authName.trim(),
              email: authEmail.trim(),
              password: authPassword,
            }
          : { email: authEmail.trim(), password: authPassword };

      const response = await fetch(`${API_URL}/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;
        throw new Error(
          message ||
            `${authMode === "login" ? "Login" : "Registration"} failed`,
        );
      }

      if (!data.accessToken) {
        throw new Error("The server did not return an access token.");
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("authUser", JSON.stringify(data.user || null));
      setCurrentUser(data.user || null);
      setToken(data.accessToken);
      setAuthPassword("");
    } catch (err) {
      setAuthError(err.message || "Unable to authenticate. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    setToken("");
    setCurrentUser(null);
    setOrders([]);
    setSelectedOrder(null);
  }
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("orderDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeNav, setActiveNav] = useState("Dashboard");

  // View order state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Create order state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Fetch orders
  useEffect(() => {
    const controller = new AbortController();

    async function fetchOrders() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(PAGE_SIZE),
          search,
          financialStatus: paymentFilter === "All" ? "" : paymentFilter,
          fulfillmentStatus:
            fulfillmentFilter === "All" ? "" : fulfillmentFilter,
          startDate,
          endDate,
          sortBy,
          sortOrder,
        });

        const response = await authorizedFetch(
          `${API_URL}/orders?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const data = await response.json();
        setOrders(data.orders || []);
        setPagination(data.pagination);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to fetch orders");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchOrders();
    return () => controller.abort();
  }, [
    currentPage,
    search,
    paymentFilter,
    fulfillmentFilter,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    refreshKey,
    token,
  ]);

  function updateFilter(callback) {
    setCurrentPage(1);
    callback();
  }

  // View order details
  async function viewOrder(orderId) {
    setSelectedOrder(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const response = await authorizedFetch(`${API_URL}/orders/${orderId}`);

      if (!response.ok) {
        throw new Error(`Unable to load order (${response.status})`);
      }

      const data = await response.json();
      setSelectedOrder(data.order);
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeOrderDetails() {
    setSelectedOrder(null);
    setDetailError("");
  }

  // Open create order form and load Shopify products
  async function openCreateModal() {
    setShowCreateModal(true);
    setCreateError("");
    setCreateSuccess("");
    setProductsLoading(true);

    try {
      const response = await authorizedFetch(`${API_URL}/shopify/products`);

      if (!response.ok) {
        throw new Error(`Unable to load products (${response.status})`);
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setProductsLoading(false);
    }
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    setCreateError("");
    setCreateSuccess("");
    setCustomerName("");
    setCustomerEmail("");
    setSelectedProduct("");
    setQuantity(1);
  }

  // Create order through backend
  async function handleCreateOrder(e) {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");

    if (!customerName.trim() || !customerEmail.trim() || !selectedProduct) {
      setCreateError("Please complete all required fields.");
      return;
    }

    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
      setCreateError("Quantity must be at least 1.");
      return;
    }

    try {
      setCreateLoading(true);

      const response = await authorizedFetch(`${API_URL}/shopify/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          lineItems: [
            {
              variantId: selectedProduct,
              quantity: Number(quantity),
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Order creation failed");
      }

      setCreateSuccess("Order created successfully in Shopify!");
      setRefreshKey((key) => key + 1);

      setTimeout(() => {
        closeCreateModal();
      }, 1200);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  }

  const pageRevenue = orders
    .filter((order) => order.financialStatus?.toUpperCase() === "PAID")
    .reduce((total, order) => total + Number(order.totalAmount || 0), 0);

  const pendingCount = orders.filter(
    (order) => order.fulfillmentStatus?.toUpperCase() === "UNFULFILLED",
  ).length;

  const fulfilledCount = orders.filter(
    (order) => order.fulfillmentStatus?.toUpperCase() === "FULFILLED",
  ).length;

  const summaryCards = [
    {
      title: "Total Orders",
      value: pagination.total,
      description: "Matching orders",
      icon: "▤",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Paid Revenue",
      value: `$${pageRevenue.toFixed(2)}`,
      description: "Current page only",
      icon: "$",
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Pending Orders",
      value: pendingCount,
      description: "Current page only",
      icon: "◷",
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "Fulfilled Orders",
      value: fulfilledCount,
      description: "Current page only",
      icon: "✓",
      color: "bg-purple-50 text-purple-600",
    },
  ];

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-5">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold mr-3">
              O
            </div>
            <span className="text-2xl font-bold text-slate-900">OrderCRM</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 text-center">
            {authMode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-slate-500 text-center mt-2 mb-7">
            {authMode === "login"
              ? "Sign in to manage your Shopify orders."
              : "Register to access your order management dashboard."}
          </p>

          {authError && (
            <p className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">
              {authError}
            </p>
          )}

          <form onSubmit={handleAuthentication} className="space-y-4">
            {authMode === "register" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Full name
                </label>
                <input
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className={inputClass}
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                Email address
              </label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className={inputClass}
                placeholder="Enter your password"
                autoComplete={
                  authMode === "login" ? "current-password" : "new-password"
                }
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 text-sm font-semibold disabled:opacity-50"
            >
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <p className="text-sm text-center text-slate-500 mt-6">
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setAuthError("");
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              {authMode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-950 text-white flex-col shrink-0">
        <div className="h-20 flex items-center px-7 border-b border-slate-800">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold mr-3">
            O
          </div>
          <span className="text-xl font-bold">OrderCRM</span>
        </div>

        <div className="px-5 py-7">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">
            Workspace
          </p>

          <nav className="space-y-2">
            {["Dashboard", "Orders", "Customers", "Products"].map((item) => (
              <button
                key={item}
                onClick={() => setActiveNav(item)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm ${
                  activeNav === item
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-5">
          <div className="bg-slate-900 rounded-xl p-4">
            <p className="text-sm font-medium">Shopify Store</p>
            <p className="text-xs text-slate-400 mt-1">ujwel-test-store</p>
            <div className="flex items-center gap-2 mt-3 text-xs text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Connected
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-5 md:px-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{activeNav}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your Shopify store
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
              {(currentUser?.name || currentUser?.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">
                {currentUser?.name || "User"}
              </p>
              <p className="text-xs text-slate-500">
                {currentUser?.email || "Signed in"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 border border-slate-200 hover:bg-slate-50 rounded-lg px-3 py-2 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="p-5 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
              <p className="text-sm text-slate-500 mt-1">
                Manage and monitor your Shopify orders.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
            >
              + Create Order
            </button>
          </div>

          {/* Summary cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {summaryCards.map((card) => (
              <div
                key={card.title}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold ${card.color}`}
                  >
                    {card.icon}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mt-4">
                  {card.value}
                </h3>
                <p className="text-xs text-slate-500 mt-2">
                  {card.description}
                </p>
              </div>
            ))}
          </section>

          {/* Orders */}
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="p-5 md:p-6 border-b border-slate-200">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-900">
                  Recent Orders
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Search, filter and manage your orders.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Search order or customer..."
                  value={search}
                  onChange={(e) =>
                    updateFilter(() => setSearch(e.target.value))
                  }
                  className={inputClass}
                />

                <select
                  value={paymentFilter}
                  onChange={(e) =>
                    updateFilter(() => setPaymentFilter(e.target.value))
                  }
                  className={inputClass}
                >
                  <option value="All">All Payments</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="REFUNDED">Refunded</option>
                </select>

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

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split("-");
                    setSortBy(field);
                    setSortOrder(direction);
                    setCurrentPage(1);
                  }}
                  className={inputClass}
                >
                  <option value="orderDate-desc">Newest first</option>
                  <option value="orderDate-asc">Oldest first</option>
                  <option value="totalAmount-desc">Highest amount</option>
                  <option value="totalAmount-asc">Lowest amount</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                      updateFilter(() => setStartDate(e.target.value))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1 block">
                    End date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) =>
                      updateFilter(() => setEndDate(e.target.value))
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-slate-500">
                Loading orders...
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => setRefreshKey((key) => key + 1)}
                  className="mt-3 text-blue-600 text-sm"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Order</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Payment</th>
                        <th className="px-6 py-4">Fulfillment</th>
                        <th className="px-6 py-4">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                            {order.orderNumber}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium">
                              {order.customer?.name || "Guest customer"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {order.customer?.email || "No email"}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold">
                            {order.currency}{" "}
                            {Number(order.totalAmount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={order.financialStatus} />
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={order.fulfillmentStatus} />
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => viewOrder(order.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}

                      {orders.length === 0 && (
                        <tr>
                          <td
                            colSpan="7"
                            className="text-center py-12 text-slate-500 text-sm"
                          >
                            No orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-slate-500">
                    Showing{" "}
                    {pagination.total === 0
                      ? 0
                      : (pagination.page - 1) * pagination.limit + 1}{" "}
                    to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}{" "}
                    of {pagination.total} orders
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <span className="text-sm px-3">
                      {pagination.totalPages === 0 ? 0 : currentPage} /{" "}
                      {pagination.totalPages}
                    </span>

                    <button
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(pagination.totalPages, page + 1),
                        )
                      }
                      disabled={currentPage >= pagination.totalPages}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <footer className="text-center text-xs text-slate-400 mt-8">
            OrderCRM · Shopify Order Management
          </footer>
        </div>
      </main>

      {/* View Order Modal */}
      {(detailLoading || detailError || selectedOrder) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button
                onClick={closeOrderDetails}
                className="text-2xl text-slate-500"
              >
                ×
              </button>
            </div>

            {detailLoading ? (
              <p className="p-8 text-center text-slate-500">
                Loading order details...
              </p>
            ) : detailError ? (
              <p className="p-8 text-center text-red-600">{detailError}</p>
            ) : (
              selectedOrder && (
                <div className="p-6 space-y-6">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">Order number</p>
                      <h3 className="text-2xl font-bold">
                        {selectedOrder.orderNumber}
                      </h3>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Order date</p>
                      <p className="font-medium">
                        {new Date(selectedOrder.orderDate).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm text-slate-500 mb-2">Payment</p>
                      <StatusBadge status={selectedOrder.financialStatus} />
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm text-slate-500 mb-2">Fulfillment</p>
                      <StatusBadge status={selectedOrder.fulfillmentStatus} />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Customer</h3>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p>{selectedOrder.customer?.name || "Guest customer"}</p>
                      <p className="text-sm text-slate-500">
                        {selectedOrder.customer?.email || "No email"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {selectedOrder.customer?.phone || ""}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Order Items</h3>
                    <div className="border rounded-xl overflow-hidden">
                      {(selectedOrder.items || []).map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between gap-4 p-4 border-b last:border-b-0"
                        >
                          <div>
                            <p className="font-medium">{item.productTitle}</p>
                            <p className="text-sm text-slate-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {selectedOrder.currency}{" "}
                            {Number(item.unitPrice * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                      {(!selectedOrder.items ||
                        selectedOrder.items.length === 0) && (
                        <p className="p-4 text-sm text-slate-500">
                          No line items available.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between border-t pt-4">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">
                      {selectedOrder.currency}{" "}
                      {Number(selectedOrder.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )
            )}

            <div className="p-6 border-t flex justify-end">
              <button
                onClick={closeOrderDetails}
                className="px-5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold">Create New Order</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Create an order in Shopify.
                </p>
              </div>
              <button
                onClick={closeCreateModal}
                className="text-2xl text-slate-500"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              {createError && (
                <p className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                  {createError}
                </p>
              )}

              {createSuccess && (
                <p className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
                  {createSuccess}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer name
                </label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={inputClass}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className={inputClass}
                  placeholder="customer@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Product
                </label>
                {productsLoading ? (
                  <p className="text-sm text-slate-500 py-3">
                    Loading Shopify products...
                  </p>
                ) : (
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.variantId} value={product.variantId}>
                        {product.title} — {product.price} {product.currency}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-5 py-2 rounded-lg border border-slate-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || productsLoading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
                >
                  {createLoading ? "Creating..." : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
