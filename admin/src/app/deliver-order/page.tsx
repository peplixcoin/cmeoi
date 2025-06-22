"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface OrderItem {
  item_id: string;
  item_name: string;
  qty: number;
  item_price: number;
  total_price: number;
}

interface Order {
  order_id: string;
  username: string;
  order_time: string;
  address: string;
  mobile_no: string;
  items: OrderItem[];
  total_amt: number;
  order_status: "pending" | "approved" | "completed";
  payment_status: "pending" | "paid" | "failed";
  completion_time?: string;
  deliverymanId?: { _id: string; Username: string; mobile_no: string };
}

export default function DeliveryOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [deliverymanId, setDeliverymanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get("adminToken");
    const role = Cookies.get("adminRole");

    const fetchDeliverymanId = async () => {
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch deliveryman ID");
        const data = await response.json();
        setDeliverymanId(data.id);
      } catch (error) {
        console.error("Error fetching deliveryman ID:", error);
        setError("Failed to authenticate. Please log in again.");
        router.push("/login");
      }
    };

    if (!token) {
      router.push("/login");
    } else if (role !== "DeliveryMan") {
      if (role === "SuperAdmin") {
        router.push("/");
      } else if (role === "Cook") {
        router.push("/cook");
      } else if (role === "Manager") {
        router.push("/today-dine-orders");
      } else {
        router.push("/login");
      }
    } else {
      fetchDeliverymanId();
    }
  }, [router]);

  useEffect(() => {
    if (!deliverymanId) return;

    const fetchApprovedOrders = async () => {
      setLoading(true);
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/approved?deliverymanId=${deliverymanId}`;
        const response = await fetchWithRetry(url);
        const data = await response.json();
        const sortedOrders = data
          .filter(
            (order: Order) =>
              order.payment_status !== "paid" &&
              order.deliverymanId?._id === deliverymanId
          )
          .sort(
            (a: Order, b: Order) =>
              new Date(b.order_time).getTime() - new Date(a.order_time).getTime()
          );
        setOrders((prevOrders) => {
          const mergedOrders = [
            ...sortedOrders,
            ...prevOrders.filter(
              (prev) =>
                prev.payment_status !== "paid" &&
                prev.deliverymanId?._id === deliverymanId &&
                !sortedOrders.some((newOrder: Order) => newOrder.order_id === prev.order_id)
            ),
          ].sort(
            (a, b) =>
              new Date(b.order_time).getTime() - new Date(a.order_time).getTime()
          );
          return mergedOrders;
        });
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to fetch orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedOrders();

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/approved/stream?deliverymanId=${deliverymanId}`
    );
    eventSource.onmessage = (event) => {
      const updatedOrder = JSON.parse(event.data);
      if (updatedOrder.deliverymanId?._id !== deliverymanId) return;
      setOrders((prevOrders) => {
        const existingOrderIndex = prevOrders.findIndex(
          (order) => order.order_id === updatedOrder.order_id
        );
        let newOrders;
        if (existingOrderIndex >= 0) {
          newOrders = [...prevOrders];
          newOrders[existingOrderIndex] = updatedOrder;
        } else {
          newOrders = [updatedOrder, ...prevOrders].sort(
            (a, b) =>
              new Date(b.order_time).getTime() - new Date(a.order_time).getTime()
          );
        }
        return newOrders.filter((order) => order.payment_status !== "paid");
      });
    };
    eventSource.onerror = () => {
      console.error("SSE error occurred");
      eventSource.close();
      setTimeout(() => {
        if (deliverymanId) {
          const newEventSource = new EventSource(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/approved/stream?deliverymanId=${deliverymanId}`
          );
          newEventSource.onmessage = eventSource.onmessage;
          newEventSource.onerror = eventSource.onerror;
        }
      }, 5000);
    };
    return () => eventSource.close();
  }, [deliverymanId]);

  const fetchWithRetry = async (
    url: string,
    options: RequestInit = {},
    retries = 3,
    delay = 1000
  ): Promise<Response> => {
    try {
      const token = Cookies.get("adminToken");
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return response;
    } catch (error) {
      if (retries <= 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const updateOrderStatus = async (orderId: string, newStatus: "completed") => {
    if (loading) return null;
    setLoading(true);
    try {
      const token = Cookies.get("adminToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order_status: newStatus }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update order status");
      }
      const updatedOrder = await response.json();
      alert("Order marked as delivered!");
      return updatedOrder;
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to mark order as delivered. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (orderId: string) => {
    if (loading) return null;
    setLoading(true);
    try {
      const token = Cookies.get("adminToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/${orderId}/payment`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ payment_status: "paid" }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update payment status");
      }
      const updatedOrder = await response.json();
      alert("Order marked as paid!");
      return updatedOrder;
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("Failed to mark order as paid. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDelivered = async (orderId: string) => {
    const isConfirmed = window.confirm("Confirm marking this order as delivered?");
    if (isConfirmed) {
      const updatedOrder = await updateOrderStatus(orderId, "completed");
      if (updatedOrder) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.order_id === orderId
              ? { ...order, order_status: "completed", completion_time: updatedOrder.completion_time }
              : order
          )
        );
      }
    }
  };

  const handleMarkAsPaid = async (orderId: string) => {
    const isConfirmed = window.confirm("Confirm marking this order as paid?");
    if (isConfirmed) {
      const updatedOrder = await updatePaymentStatus(orderId);
      if (updatedOrder) {
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order.order_id !== orderId)
        );
      }
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-xl px-6 py-2 shadow-lg">
            <h1 className="text-base text-center font-bold text-white ">Deliver Orders</h1>
          </div>

          {error && (
            <div className="w-full bg-red-50 p-3 flex items-center justify-center">
              <span className="text-red-600 font-medium">{error}</span>
            </div>
          )}

          {loading && (
            <div className="w-full bg-blue-50 p-3 flex items-center justify-center">
              <div className="animate-pulse flex space-x-2">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              </div>
              <span className="ml-3 text-blue-600 font-medium">Updating...</span>
            </div>
          )}

          <div className="p-6">
            {orders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((order, index) => (
                  <div
                    key={`${order.order_id}-${index}`}
                    className="bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            ID: {order.order_id}
                          </span>
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(order.order_time).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Kolkata",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">₹{order.total_amt}</p>
                          <p className="text-xs text-gray-500">Total Amount</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-500 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <p className="text-sm text-gray-700 truncate">{order.address}</p>
                        </div>
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-500 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p className="text-sm text-gray-700">
                            {new Date(order.order_time).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Kolkata",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                          onClick={() => toggleOrderDetails(order.order_id)}
                          className="flex items-center justify-center bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {expandedOrders[order.order_id] ? "Hide Details" : "Order Items"}
                        </button>

                        <a
                          href={`tel:${order.mobile_no}`}
                          className="flex items-center justify-center bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg border border-blue-200 hover:bg-yellow-100 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          Call Customer
                        </a>
                      </div>

                      {expandedOrders[order.order_id] && (
                        <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            Order Details
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th
                                    scope="col"
                                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Item
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Qty
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Price
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    Total
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {order.items.map((item) => (
                                  <tr key={item.item_id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-sm text-gray-900">{item.item_name}</td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-900">{item.qty}</td>
                                    <td className="px-3 py-2 text-sm text-right text-gray-900">₹{item.item_price}</td>
                                    <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">
                                      ₹{item.total_price}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-gray-50">
                                  <td
                                    colSpan={3}
                                    className="px-3 py-2 text-sm font-medium text-right text-gray-700"
                                  >
                                    Total:
                                  </td>
                                  <td className="px-3 py-2 text-sm font-bold text-right text-green-600">
                                    ₹{order.total_amt}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <div className="mt-5">
                        {order.order_status === "approved" && (
                          <button
                            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleMarkAsDelivered(order.order_id)}
                            disabled={loading}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Mark as Delivered
                          </button>
                        )}

                        {order.order_status === "completed" && order.payment_status === "pending" && (
                          <button
                            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleMarkAsPaid(order.order_id)}
                            disabled={loading}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                            Confirm Payment Received
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="mt-4 text-lg text-gray-500 font-medium">No active orders found</p>
                <p className="text-gray-400">Check your connection or wait for new orders</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}