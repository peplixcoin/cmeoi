"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Masonry from "react-masonry-css";

interface OrderItem {
  item_id: string;
  item_name: string;
  qty: number;
  item_price: number;
  total_price: number;
}

interface DeliveryMan {
  _id: string;
  Username: string;
  mobile_no: string;
}

interface Order {
  order_id: string;
  username: string;
  order_time: string;
  items: OrderItem[];
  total_amt: number;
  order_status: "pending" | "approved" | "completed";
  payment_status: "pending" | "paid" | "failed";
  completion_time?: string;
  table_number?: number;
  address?: string;
  mobile_no?: string;
  isOnlineOrder: boolean;
  deliverymanId?: DeliveryMan | null;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<
    "pending" | "approved" | "paid"
  >("pending");
  const [selectedOrderType, setSelectedOrderType] = useState<
    "all" | "dine" | "online"
  >("all");
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([]);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedDeliveryManId, setSelectedDeliveryManId] = useState<string>("");

  // Masonry layout breakpoints
  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1,
  };

  useEffect(() => {
    const token = Cookies.get("adminToken");
    if (!token) {
      router.push("/login");
    } else {
      fetchTodaysOrders();

      const dineEventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/stream`
      );
      const onlineEventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/stream`
      );

      const handleNewOrder = (event: MessageEvent, isOnline: boolean) => {
        const newOrder = { ...JSON.parse(event.data), isOnlineOrder: isOnline };
        setOrders((prevOrders) => {
          const filteredOrders = prevOrders.filter(
            (order) => order.order_id !== newOrder.order_id
          );
          const updatedOrders = [newOrder, ...filteredOrders];
          filterOrders(selectedStatus, selectedOrderType, updatedOrders);
          return updatedOrders;
        });
      };

      dineEventSource.onmessage = (event) => handleNewOrder(event, false);
      onlineEventSource.onmessage = (event) => handleNewOrder(event, true);

      dineEventSource.onerror = () => dineEventSource.close();
      onlineEventSource.onerror = () => onlineEventSource.close();

      return () => {
        dineEventSource.close();
        onlineEventSource.close();
      };
    }
  }, [router, selectedStatus, selectedOrderType]);

  const fetchWithRetry = async (
    url: string,
    options: RequestInit = {},
    retries = 3,
    delay = 1000
  ): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return response;
    } catch (error: unknown) {
      if (retries <= 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
  };

  const fetchTodaysOrders = async () => {
    setIsLoading(true);
    try {
      const [dineResponse, onlineResponse] = await Promise.all([
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/today`),
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/today`),
      ]);

      const dineOrders: Order[] = await dineResponse.json();
      const onlineOrders: Order[] = await onlineResponse.json();

      const combinedOrders = [
        ...dineOrders.map((order) => ({ ...order, isOnlineOrder: false })),
        ...onlineOrders.map((order) => ({ ...order, isOnlineOrder: true })),
      ].sort(
        (a, b) =>
          new Date(b.order_time).getTime() - new Date(a.order_time).getTime()
      );

      setOrders(combinedOrders);
      filterOrders(selectedStatus, selectedOrderType, combinedOrders);
    } catch (error: unknown) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeliveryMen = async () => {
    try {
      const response = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/deliverymen`
      );
      const data = await response.json();
      setDeliveryMen(data);
    } catch (error: unknown) {
      console.error("Error fetching delivery men:", error);
      alert("Failed to fetch delivery men. Please try again.");
    }
  };

  const assignDeliveryMan = async (orderId: string, deliverymanId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/${orderId}/assign-delivery`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deliverymanId }),
        }
      );
      if (!response.ok) throw new Error("Failed to assign delivery man");
      setShowDeliveryModal(false);
      setSelectedOrderId(null);
      setSelectedDeliveryManId("");
      await fetchTodaysOrders();
    } catch (error: unknown) {
      alert("Failed to assign delivery man. Please try again.");
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: "approved" | "completed",
    isOnline: boolean
  ) => {
    try {
      const endpoint = isOnline
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/${orderId}/status`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/${orderId}/status`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update order status");
      }
      await fetchTodaysOrders();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      alert(err.message || "Failed to update order status. Please try again.");
    }
  };

  const updatePaymentStatus = async (orderId: string, isOnline: boolean) => {
    try {
      const endpoint = isOnline
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/${orderId}/payment`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/${orderId}/payment`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: "paid" }),
      });
      if (!response.ok) throw new Error("Failed to update payment status");
      await fetchTodaysOrders();
    } catch (error: unknown) {
      alert("Failed to update payment status. Please try again.");
    }
  };

  const handleMarkAsPaid = async (orderId: string, isOnline: boolean) => {
    const isConfirmed = window.confirm("Please Confirm");
    if (isConfirmed) {
      await updatePaymentStatus(orderId, isOnline);
    }
  };

  const handleMarkAsCompleted = async (orderId: string, isOnline: boolean) => {
    const isConfirmed = window.confirm("Please Confirm");
    if (isConfirmed) {
      await updateOrderStatus(orderId, "completed", isOnline);
      setSelectedStatus("approved");
    }
  };

  const handleAssignDeliveryMan = (orderId: string) => {
    fetchDeliveryMen();
    setSelectedOrderId(orderId);
    setShowDeliveryModal(true);
  };

  const filterOrders = (
    status: "pending" | "approved" | "paid",
    type: "all" | "dine" | "online",
    ordersData?: Order[]
  ) => {
    const data = ordersData || orders;

    let filtered = data;
    if (type === "dine") {
      filtered = data.filter((order) => !order.isOnlineOrder);
    } else if (type === "online") {
      filtered = data.filter((order) => order.isOnlineOrder);
    }

    if (status === "paid") {
      filtered = filtered.filter((order) => order.payment_status === "paid");
    } else if (status === "approved") {
      filtered = filtered.filter(
        (order) =>
          (order.order_status === "approved" &&
            order.payment_status === "pending") ||
          (order.order_status === "completed" &&
            order.payment_status === "pending")
      );
    } else {
      filtered = filtered.filter((order) => order.order_status === status);
    }

    setFilteredOrders(filtered);
    setSelectedStatus(status);
    setSelectedOrderType(type);
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusColor = (order: Order) => {
    if (order.payment_status === "paid") return "bg-green-100 text-green-800";
    if (order.order_status === "completed") return "bg-blue-100 text-blue-800";
    if (order.order_status === "approved") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  const getStatusText = (order: Order) => {
    if (order.payment_status === "paid") return "Paid";
    return order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1);
  };

  const getActionButton = (order: Order) => {
    if (order.order_status === "pending") {
      return (
        <button
          className="w-full px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-medium shadow-sm hover:from-yellow-600 hover:to-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 transition-all duration-150 flex items-center justify-center"
          onClick={() =>
            updateOrderStatus(order.order_id, "approved", order.isOnlineOrder)
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Approve Order
        </button>
      );
    } else if (
      order.order_status === "approved" &&
      order.payment_status === "pending"
    ) {
      return order.isOnlineOrder ? (
        <div className="space-y-2">
          <button
            className={`w-full px-4 py-2 ${
              order.deliverymanId
                ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            } text-white rounded-lg font-medium shadow-sm focus:ring-2 focus:ring-opacity-50 transition-all duration-150 flex items-center justify-center`}
            onClick={() => handleAssignDeliveryMan(order.order_id)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
            {order.deliverymanId ? "Delivery Man Assigned" : "Assign Delivery Man"}
          </button>
        </div>
      ) : (
        <button
          className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium shadow-sm hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-150 flex items-center justify-center"
          onClick={() =>
            handleMarkAsCompleted(order.order_id, order.isOnlineOrder)
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Mark as Completed
        </button>
      );
    } else if (
      order.order_status === "completed" &&
      order.payment_status === "pending"
    ) {
      if (!order.isOnlineOrder) {
        return (
          <button
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium shadow-sm hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-150 flex items-center justify-center"
            onClick={() => handleMarkAsPaid(order.order_id, order.isOnlineOrder)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            Mark as Paid
          </button>
        );
      }
      return null;
    }
    return null;
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-xl px-6 py-2 shadow-lg">
            <h1 className="text-base text-center font-bold text-white">
              Today's Orders
            </h1>
          </div>

          <div className="bg-white p-4 shadow-md border-b border-gray-200">
            <div className="flex flex-wrap gap-2 mb-4">
              {["all", "dine", "online"].map((type) => (
                <button
                  key={type}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    selectedOrderType === type
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() =>
                    filterOrders(
                      selectedStatus,
                      type as "all" | "dine" | "online"
                    )
                  }
                >
                  {type === "all" && "All Orders"}
                  {type === "dine" && "Dine Orders"}
                  {type === "online" && "Online Orders"}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {["pending", "approved", "paid"].map((status) => (
                <button
                  key={status}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    selectedStatus === status
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() =>
                    filterOrders(
                      status as "pending" | "approved" | "paid",
                      selectedOrderType
                    )
                  }
                >
                  {status === "pending" && (
                    <span className="inline-flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Pending
                    </span>
                  )}
                  {status === "approved" && (
                    <span className="inline-flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Approved
                    </span>
                  )}
                  {status === "paid" && (
                    <span className="inline-flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Paid
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-b-xl shadow-lg p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredOrders.length > 0 ? (
              <Masonry
                breakpointCols={breakpointColumnsObj}
                className="flex -ml-4 w-auto"
                columnClassName="pl-4 bg-clip-padding"
              >
                {filteredOrders.map((order) => (
                  <div
                    key={order.order_id}
                    className="mb-6 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(
                              order
                            )}`}
                          >
                            {getStatusText(order)}
                          </span>
                          <div className="flex items-center mt-1">
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                              {order.isOnlineOrder ? "Online" : "Dine"}
                            </span>
                          </div>
                          <h3 className="text-lg font-medium mt-1 text-gray-800">
                            ID: {order.order_id}
                          </h3>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            <span className="inline-flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {formatTime(order.order_time)}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-600">
                          Customer Details
                        </h4>
                        <p className="text-sm text-gray-700 mt-1">
                          <span className="font-medium">Name:</span>{" "}
                          {order.username}
                        </p>
                        {order.isOnlineOrder ? (
                          <>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Address:</span>{" "}
                              {order.address}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Mobile:</span>{" "}
                              {order.mobile_no}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Table:</span>{" "}
                            {order.table_number}
                          </p>
                        )}
                      </div>

                      {order.isOnlineOrder && order.deliverymanId && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-600">
                            Delivery Man
                          </h4>
                          <p className="text-sm text-gray-700 mt-1">
                            <span className="font-medium">Name:</span>{" "}
                            {order.deliverymanId.Username}
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Mobile:</span>{" "}
                            {order.deliverymanId.mobile_no}
                          </p>
                        </div>
                      )}

                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-600">
                          Items
                        </h4>
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm text-gray-700 mt-1"
                          >
                            <span>
                              {item.qty} x {item.item_name}
                            </span>
                            <span>₹{item.total_price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm font-semibold text-gray-600">
                          Total:
                        </span>
                        <span className="text-lg font-bold text-gray-800">
                          ₹{order.total_amt.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      {getActionButton(order)}
                    </div>
                  </div>
                ))}
              </Masonry>
            ) : (
              <div className="text-center py-20">
               <svg
  xmlns="http://www.w3.org/2000/svg"
  className="h-16 w-16 mx-auto text-yellow-400"
  viewBox="0 0 20 20"
  fill="currentColor"
>
  <path
    fillRule="evenodd"
    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
    clipRule="evenodd"
  />
</svg>
                <p className="mt-4 text-gray-500 text-lg">
                  No orders found for the selected filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Assign Delivery Man
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Delivery Man
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDeliveryManId}
                onChange={(e) => setSelectedDeliveryManId(e.target.value)}
              >
                <option value="">Select a delivery man</option>
                {deliveryMen.map((deliveryMan) => (
                  <option key={deliveryMan._id} value={deliveryMan._id}>
                    {deliveryMan.Username} ({deliveryMan.mobile_no})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-150"
                onClick={() => {
                  setShowDeliveryModal(false);
                  setSelectedOrderId(null);
                  setSelectedDeliveryManId("");
                }}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-150 ${
                  !selectedDeliveryManId
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={() => {
                  if (selectedOrderId && selectedDeliveryManId) {
                    assignDeliveryMan(selectedOrderId, selectedDeliveryManId);
                  }
                }}
                disabled={!selectedDeliveryManId}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}