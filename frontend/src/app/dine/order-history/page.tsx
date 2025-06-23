"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { ShoppingBag, Calendar, Clock, CheckCircle, AlertCircle, User } from "lucide-react";

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
  items: OrderItem[];
  total_amt: number;
  order_status: string;
  payment_status: string;
}

interface FamilyMember {
  username: string;
}

export default function DineOrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [familyOrders, setFamilyOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"my-orders" | "family-orders">("my-orders");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const username = Cookies.get("username");

    if (!username) {
      setError("User not logged in");
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        // Fetch my orders
        const myOrdersResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${username}`
        );
        if (!myOrdersResponse.ok) throw new Error("Failed to fetch my orders");
        const myOrdersData = await myOrdersResponse.json();
        setOrders(myOrdersData);

        // Fetch user details to get role
        const userDetailsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/user/${username}`
        );
        if (userDetailsResponse.ok) {
          const userDetails = await userDetailsResponse.json();
          setUserRole(userDetails.role);

          // Fetch family orders if user is not a family member
          if (userDetails.role !== "family") {
            const familyMembersResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/user/${username}/family`
            );
            if (familyMembersResponse.ok) {
              const familyMembers: FamilyMember[] = await familyMembersResponse.json();
              const familyUsernames = familyMembers.map((member) => member.username);

              // Fetch orders for each family member
              const allFamilyOrders = await Promise.all(
                familyUsernames.map(async (familyUsername: string) => {
                  const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${familyUsername}`
                  );
                  if (response.ok) {
                    const orders = await response.json();
                    return orders.map((order: Order) => ({ ...order, username: familyUsername }));
                  }
                  return [];
                })
              );

              // Flatten the array of arrays into a single array
              setFamilyOrders(allFamilyOrders.flat());
            }
          }
        }
      } catch {
        setError("Error fetching orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "approved":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentBadgeClass = (status: string) => {
    return status === "paid"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      dateFormatted: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      timeFormatted: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const renderOrders = (ordersToRender: Order[]) => {
    if (ordersToRender.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-10 text-center">
          <div className="bg-gray-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <ShoppingBag size={32} className="text-gray-400 sm:w-10 sm:h-10" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
            No Orders Found
          </h3>
          <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
            {activeTab === "my-orders"
              ? "You haven't placed any dine-in orders yet. Browse our menu to place your first order."
              : "Your family members haven't placed any dine-in orders yet."}
          </p>
          <button
            onClick={() => router.push("/dine/menu")}
            className="mt-4 sm:mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 sm:px-6 py-2 rounded-lg transition-all duration-200 text-sm sm:text-base"
          >
            Browse Menu
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {ordersToRender.map((order) => {
          const { dateFormatted, timeFormatted } = formatDate(order.order_time);

          return (
            <div
              key={order.order_id}
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all duration-200 hover:shadow-md"
            >
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex flex-wrap justify-between items-start gap-3 sm:gap-4">
                  <div>
                    <div className="flex items-center">
                      <span className="text-xs bg-indigo-100 text-indigo-800 rounded-full px-2 py-1 mr-2 font-medium">
                        #{order.order_id.slice(-6)}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-gray-800">
                        Order Details
                      </h2>
                    </div>

                    {/* Added family member username display for family orders */}
                    {activeTab === "family-orders" && (
                      <div className="flex items-center mt-1 text-sm text-gray-600">
                        <User className="w-4 h-4 mr-1" />
                        <span>{order.username}</span>
                      </div>
                    )}

                    <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:items-center text-gray-600 text-xs sm:text-sm gap-2 sm:gap-3">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        <span>{dateFormatted}</span>
                      </div>
                      <div className="hidden sm:block text-gray-300">•</div>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        <span>{timeFormatted}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                        order.order_status
                      )}`}
                    >
                      Status:{" "}
                      {order.order_status === "completed"
                        ? "Served"
                        : order.order_status === "approved"
                        ? "Preparing"
                        : "Pending"}
                    </span>
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getPaymentBadgeClass(
                        order.payment_status
                      )}`}
                    >
                      Payment:{" "}
                      {order.payment_status.charAt(0).toUpperCase() +
                        order.payment_status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="py-2 sm:py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-700 w-1/2">
                        Item Name
                      </th>
                      <th className="py-2 sm:py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-700 text-center w-1/6">
                        Quantity
                      </th>
                      <th className="py-2 sm:py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-700 text-right w-1/6">
                        Price
                      </th>
                      <th className="py-2 sm:py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-700 text-right w-1/6">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map((item, index) => (
                      <tr
                        key={item.item_id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="py-2 sm:py-3 px-3 sm:px-6 text-xs sm:text-sm text-gray-800">
                          {item.item_name}
                        </td>
                        <td className="py-2 sm:py-3 px-3 sm:px-6 text-xs sm:text-sm text-gray-800 text-center">
                          {item.qty}
                        </td>
                        <td className="py-2 sm:py-3 px-3 sm:px-6 text-xs sm:text-sm text-gray-800 text-right">
                          ₹{item.item_price.toFixed(2)}
                        </td>
                        <td className="py-2 sm:py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-800 text-right">
                          ₹{item.total_price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 p-4 sm:p-6 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center">
                    {order.order_status === "completed" && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle size={16} className="mr-1 sm:mr-2" />
                        <span className="font-medium text-sm sm:text-base">
                          Order served successfully
                        </span>
                      </div>
                    )}

                    {order.order_status === "pending" && (
                      <div className="flex items-center text-yellow-600">
                        <Clock size={16} className="mr-1 sm:mr-2" />
                        <span className="font-medium text-sm sm:text-base">
                          Order is being processed
                        </span>
                      </div>
                    )}

                    {order.order_status === "approved" && (
                      <div className="flex items-center text-blue-600">
                        <CheckCircle size={16} className="mr-1 sm:mr-2" />
                        <span className="font-medium text-sm sm:text-base">
                          Order is being prepared
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-medium text-sm sm:text-base">
                      Total Amount:
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-indigo-700">
                      ₹{order.total_amt.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen py-4 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-md mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                  Your Order Timeline
                </h2>
                <p className="text-sm sm:text-base opacity-90">
                  Track all your dine-in orders
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 inline-flex items-center">
                <ShoppingBag
                  className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5"
                />
                <span className="font-semibold text-sm sm:text-base">
                  {activeTab === "my-orders" ? orders.length : familyOrders.length}{" "}
                  Orders
                </span>
              </div>
            </div>
          </div>

          {/* Tabs for switching between my orders and family orders */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-2 px-4 font-medium text-sm sm:text-base border-b-2 transition-colors duration-200 ${
                activeTab === "my-orders"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("my-orders")}
            >
              My Orders
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm sm:text-base border-b-2 transition-colors duration-200 ${
                activeTab === "family-orders"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("family-orders")}
            >
              Family Orders
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-16 sm:py-20">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center mb-6">
            <AlertCircle className="text-red-500 mr-2 sm:mr-3 w-5 h-5 sm:w-6 sm:h-6" />
            <p className="text-red-600 text-sm sm:text-base">{error}</p>
          </div>
        )}

        {!loading && !error && activeTab === "family-orders" && userRole === "family" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center mb-6">
            <AlertCircle className="text-red-500 mr-2 sm:mr-3 w-5 h-5 sm:w-6 sm:h-6" />
            <p className="text-red-600 text-sm sm:text-base">
              You cannot see your family orders
            </p>
          </div>
        )}

        {!loading && !error && (activeTab === "my-orders" || userRole !== "family") && (
          <>
            {activeTab === "my-orders" && renderOrders(orders)}
            {activeTab === "family-orders" && renderOrders(familyOrders)}
          </>
        )}
      </div>
    </div>
  );
}