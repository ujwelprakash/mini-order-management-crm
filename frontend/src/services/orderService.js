import { apiRequest } from "./api";

export const getOrders = async (filters = {}) => {
  const params = new URLSearchParams({
    page: String(filters.page || 1),
    limit: String(filters.limit || 5),
    search: filters.search || "",
    financialStatus:
      filters.paymentFilter === "All" ? "" : filters.paymentFilter || "",
    fulfillmentStatus:
      filters.fulfillmentFilter === "All"
        ? ""
        : filters.fulfillmentFilter || "",
    startDate: filters.startDate || "",
    endDate: filters.endDate || "",
    sortBy: filters.sortBy || "orderDate",
    sortOrder: filters.sortOrder || "desc",
  });

  return apiRequest(`/orders?${params.toString()}`);
};

export const getOrderById = async (orderId) => {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  return apiRequest(`/orders/${orderId}`);
};

export const getShopifyProducts = async () => {
  return apiRequest("/shopify/products");
};

export const createShopifyOrder = async ({
  customerName,
  customerEmail,
  lineItems,
}) => {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw new Error("Please select a valid product.");
  }

  const validLineItems = lineItems.map((item) => ({
    variantId: item.variantId,
    quantity: Number(item.quantity),
  }));

  if (
    validLineItems.some(
      (item) =>
        !item.variantId ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1,
    )
  ) {
    throw new Error("Invalid product or quantity.");
  }

  return apiRequest("/shopify/orders", {
    method: "POST",
    body: JSON.stringify({
      customerName,
      customerEmail,
      lineItems: validLineItems,
    }),
  });
};
