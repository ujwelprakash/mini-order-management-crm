import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Orders from "./Orders";

import { getOrders } from "../services/orderService";

vi.mock("../services/orderService", () => ({
  getOrders: vi.fn(),
  getOrderById: vi.fn(),
  getShopifyProducts: vi.fn(),
  createShopifyOrder: vi.fn(),
}));

vi.mock("../components/OrderTable", () => ({
  default: ({ orders, loading, error }) => (
    <div data-testid="orders-table">
      {loading && <p>Loading orders...</p>}
      {error && <p>{error}</p>}
      {orders.map((order) => (
        <p key={order.id}>{order.orderNumber}</p>
      ))}
    </div>
  ),
}));

vi.mock("../components/Modal", () => ({
  default: ({ isOpen, children }) => (isOpen ? <div>{children}</div> : null),
}));

describe("Orders Page", () => {
  const mockOrders = [
    { id: "1", orderNumber: "#1001" },
    { id: "2", orderNumber: "#1002" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    getOrders.mockResolvedValue({
      orders: mockOrders,
      pagination: {
        total: 12,
        totalPages: 3,
      },
    });
  });

  it("should render the Orders page", async () => {
    render(<Orders />);

    expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Create Order/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("#1001")).toBeInTheDocument();
    });
  });

  it("should fetch orders when the page loads", async () => {
    render(<Orders />);

    await waitFor(() => {
      expect(getOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 5,
          search: "",
        }),
      );
    });
  });

  it("should search orders by customer or order number", async () => {
    render(<Orders />);

    await waitFor(() => {
      expect(getOrders).toHaveBeenCalled();
    });

    fireEvent.change(
      screen.getByPlaceholderText("Search order or customer..."),
      {
        target: { value: "John" },
      },
    );

    await waitFor(() => {
      expect(getOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: "John",
          page: 1,
        }),
      );
    });
  });

  it("should filter orders by payment status", async () => {
    render(<Orders />);

    await waitFor(() => {
      expect(getOrders).toHaveBeenCalled();
    });

    const selects = screen.getAllByRole("combobox");

    fireEvent.change(selects[0], {
      target: { value: "PAID" },
    });

    await waitFor(() => {
      expect(getOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({
          paymentFilter: "PAID",
        }),
      );
    });
  });

  it("should filter orders by fulfillment status", async () => {
    render(<Orders />);

    await waitFor(() => {
      expect(getOrders).toHaveBeenCalled();
    });

    const selects = screen.getAllByRole("combobox");

    fireEvent.change(selects[1], {
      target: { value: "FULFILLED" },
    });

    await waitFor(() => {
      expect(getOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({
          fulfillmentFilter: "FULFILLED",
        }),
      );
    });
  });

  it("should change pagination when Next is clicked", async () => {
    render(<Orders />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(getOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 5,
        }),
      );
    });
  });
});
