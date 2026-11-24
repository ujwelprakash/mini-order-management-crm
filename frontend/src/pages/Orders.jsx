import { useCallback, useEffect, useMemo, useState } from "react";

import OrderFilters from "../components/OrderFilters";
import OrderTable from "../components/OrderTable";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";

import {
  getOrders,
  getOrderById,
  getShopifyProducts,
  createShopifyOrder,
} from "../services/orderService";

import formatCurrency from "../utils/formatCurrency";
import formatDate from "../utils/formatDate";

const PAGE_SIZE = 5;

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-500 dark:focus:ring-blue-900";

const labelClass =
  "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("All");

  const [sortBy, setSortBy] = useState("orderDate");
  const [sortOrder, setSortOrder] = useState("desc");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // View order
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // Create order
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getOrders({
        page,
        limit: PAGE_SIZE,
        search,
        paymentFilter,
        fulfillmentFilter,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      });

      setOrders(data.orders || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(
        data.pagination?.totalItems ??
          data.pagination?.totalOrders ??
          data.pagination?.total ??
          data.orders?.length ??
          0,
      );
    } catch (err) {
      setError(err.message || "Failed to fetch orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    paymentFilter,
    fulfillmentFilter,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateFilter = (callback) => {
    setPage(1);
    callback?.();
  };

  // View order details
  const handleViewOrder = async (orderId) => {
    try {
      setDetailsLoading(true);
      setDetailsError("");
      setSelectedOrder(null);

      const data = await getOrderById(orderId);
      setSelectedOrder(data.order || data);
    } catch (err) {
      setDetailsError(err.message || "Unable to load order details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedOrder(null);
    setDetailsError("");
  };

  // Convert Shopify products into selectable variants.
  const productVariants = useMemo(() => {
    return products
      .flatMap((product) => {
        const variants = product.variants || [];

        if (variants.length > 0) {
          return variants.map((variant) => ({
            id: variant.id,
            title: `${product.title || product.name || "Product"} - ${
              variant.title || "Default"
            }`,
            price: variant.price,
          }));
        }

        return [
          {
            id: product.variantId || product.id,
            title: product.title || product.name || "Product",
            price: product.price,
          },
        ];
      })
      .filter((variant) => variant.id);
  }, [products]);

  // Load products when Create Order is opened.
  const openCreateModal = async () => {
    setShowCreateModal(true);
    setCreateError("");

    if (products.length > 0) return;

    try {
      setProductsLoading(true);

      const data = await getShopifyProducts();
      setProducts(data.products || []);
    } catch (err) {
      setCreateError(err.message || "Unable to load Shopify products.");
    } finally {
      setProductsLoading(false);
    }
  };

  const resetCreateForm = () => {
    setCustomerName("");
    setCustomerEmail("");
    setSelectedVariant("");
    setQuantity(1);
    setCreateError("");
  };

  const closeCreateModal = () => {
    if (createLoading) return;

    setShowCreateModal(false);
    resetCreateForm();
  };

  const handleCreateOrder = async (event) => {
    event.preventDefault();

    if (!customerName.trim() || !customerEmail.trim()) {
      setCreateError("Please enter the customer's name and email.");
      return;
    }

    if (!selectedVariant) {
      setCreateError("Please select a product.");
      return;
    }

    if (Number(quantity) < 1) {
      setCreateError("Quantity must be at least 1.");
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError("");

      await createShopifyOrder({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        lineItems: [
          {
            variantId: selectedVariant,
            quantity: Number(quantity),
          },
        ],
      });

      setShowCreateModal(false);
      resetCreateForm();

      if (page !== 1) {
        setPage(1);
      } else {
        await fetchOrders();
      }
    } catch (err) {
      setCreateError(err.message || "Failed to create order.");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page heading and Create button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Orders
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage and track all your Shopify orders.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Create Order
        </button>
      </div>

      {/* Filters */}
      <OrderFilters
        search={search}
        setSearch={setSearch}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        fulfillmentFilter={fulfillmentFilter}
        setFulfillmentFilter={setFulfillmentFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        updateFilter={updateFilter}
      />

      {/* Orders table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <OrderTable
          orders={orders}
          loading={loading}
          error={error}
          onRetry={fetchOrders}
          onViewOrder={handleViewOrder}
        />

        {!loading && !error && totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Create Order Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title="Create Shopify Order"
      >
        <form
          onSubmit={handleCreateOrder}
          className="space-y-4 text-gray-900 dark:text-white"
        >
          <div>
            <label className={labelClass}>Customer name</label>

            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Customer email</label>

            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Enter customer email"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Product</label>

            {productsLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading products...
              </p>
            ) : (
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Select a product</option>

                {productVariants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.title}
                    {variant.price != null ? ` - ${variant.price}` : ""}
                  </option>
                ))}
              </select>
            )}

            {!productsLoading && products.length === 0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                No products were returned by the backend.
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Quantity</label>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {createError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">
              {createError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={createLoading}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                createLoading || productsLoading || productVariants.length === 0
              }
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createLoading ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Order Details Modal */}
      <Modal
        isOpen={
          detailsLoading || Boolean(selectedOrder) || Boolean(detailsError)
        }
        onClose={closeDetails}
        title={
          selectedOrder
            ? `Order ${selectedOrder.orderNumber || ""}`
            : "Order Details"
        }
      >
        {detailsLoading ? (
          <p className="py-8 text-center text-gray-500 dark:text-gray-400">
            Loading order details...
          </p>
        ) : detailsError ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">
            {detailsError}
          </p>
        ) : selectedOrder ? (
          <div className="space-y-6 text-gray-900 dark:text-white">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Customer
                </p>
                <p className="font-medium">
                  {selectedOrder.customerName ||
                    selectedOrder.customer?.name ||
                    "N/A"}
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedOrder.customerEmail ||
                    selectedOrder.customer?.email ||
                    ""}
                </p>

                {selectedOrder.customer?.phone && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedOrder.customer.phone}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Order date
                </p>
                <p className="font-medium">
                  {formatDate(selectedOrder.orderDate)}
                </p>
              </div>

              <div>
                <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                  Payment status
                </p>
                <StatusBadge status={selectedOrder.financialStatus} />
              </div>

              <div>
                <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                  Fulfillment status
                </p>
                <StatusBadge status={selectedOrder.fulfillmentStatus} />
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold">Order items</h3>

              <div className="space-y-3">
                {selectedOrder.items?.length > 0 ? (
                  selectedOrder.items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="flex justify-between gap-4 border-b border-slate-200 pb-3 dark:border-slate-700"
                    >
                      <div>
                        <p className="font-medium">{item.productTitle}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Quantity: {item.quantity}
                        </p>
                      </div>

                      <p className="font-medium">
                        {formatCurrency(
                          Number(item.unitPrice) * Number(item.quantity),
                          selectedOrder.currency,
                        )}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No order items found.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
              <span className="font-semibold">Total</span>
              <span className="font-bold">
                {formatCurrency(
                  selectedOrder.totalAmount,
                  selectedOrder.currency,
                )}
              </span>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default Orders;
