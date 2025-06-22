"use client";

import { useEffect, useState, useRef } from "react";
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

interface Order {
  order_id: string;
  username: string;
  table_number?: number;
  address?: string;
  mobile_no?: string;
  order_time: string;
  items: OrderItem[];
  total_amt: number;
  order_status: "pending" | "approved" | "completed";
  payment_status: "pending" | "paid" | "failed";
  completion_time?: string;
  deliverymanId?: { _id: string; Username: string; mobile_no: string } | null;
}

export default function CookOrdersPage() {
  const router = useRouter();
  const [dineOrders, setDineOrders] = useState<Order[]>([]);
  const [onlineOrders, setOnlineOrders] = useState<Order[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Masonry layout breakpoints for dine-in (3 columns)
  const dineBreakpointColumnsObj = {
    default: 4,
    1100: 2,
    700: 1,
  };

  // Masonry layout breakpoints for online orders (2 columns)
  const onlineBreakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1,
  };

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Fetch approved orders with retry logic
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

  // Fetch approved orders (dine and online)
  const fetchApprovedOrders = async () => {
    try {
      const [dineResponse, onlineResponse] = await Promise.all([
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/approved`),
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/approved/cook`),
      ]);

      const dineData = await dineResponse.json();
      const onlineData = await onlineResponse.json();

      const sortOrders = (a: Order, b: Order) =>
        new Date(b.order_time).getTime() - new Date(a.order_time).getTime();

      setDineOrders(dineData.sort(sortOrders));
      setOnlineOrders(onlineData.sort(sortOrders));
      setError(null);
    } catch (error) {
      console.error("Error fetching approved orders:", error);
      setError("Failed to fetch orders. Please try again later.");
    }
  };

  // Handle order updates from SSE
  const handleOrderUpdate = (prevOrders: Order[], updatedOrder: Order, isOnline: boolean) => {
    console.log("Handling order update:", updatedOrder.order_id, "DeliveryMan:", updatedOrder.deliverymanId, "IsOnline:", isOnline);
    if (isOnline && (updatedOrder.deliverymanId || updatedOrder.order_status === "completed")) {
      console.log("Removing online order:", updatedOrder.order_id);
      return prevOrders.filter((order) => order.order_id !== updatedOrder.order_id);
    }
    if (!isOnline && updatedOrder.order_status === "completed") {
      console.log("Removing dine order:", updatedOrder.order_id);
      return prevOrders.filter((order) => order.order_id !== updatedOrder.order_id);
    }
    const existingOrderIndex = prevOrders.findIndex(
      (order) => order.order_id === updatedOrder.order_id
    );
    if (existingOrderIndex >= 0) {
      console.log("Updating existing order:", updatedOrder.order_id);
      const newOrders = [...prevOrders];
      newOrders[existingOrderIndex] = updatedOrder;
      return newOrders;
    }
    console.log("Adding new order:", updatedOrder.order_id);
    return [updatedOrder, ...prevOrders].sort(
      (a, b) =>
        new Date(b.order_time).getTime() - new Date(a.order_time).getTime()
    );
  };

  // Function to start polling for online orders
  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (onlineOrders.length > 0) {
      console.log("Starting polling for online orders...");
      pollingIntervalRef.current = setInterval(() => {
        console.log("Polling for online orders...");
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/approved/cook`)
          .then((response) => response.json())
          .then((onlineData) => {
            const sortOrders = (a: Order, b: Order) =>
              new Date(b.order_time).getTime() - new Date(a.order_time).getTime();
            setOnlineOrders(onlineData.sort(sortOrders));
          })
          .catch((error) => {
            console.error("Error polling online orders:", error);
          });
      }, 10000); // Poll every 10 seconds
    } else {
      console.log("No online orders - polling stopped");
    }
  };

  useEffect(() => {
    const token = Cookies.get("adminToken");
    const role = Cookies.get("adminRole");
    if (!token) {
      router.push("/login");
    } else if (role !== "Cook" && role !== "Manager") {
      if (role === "SuperAdmin") {
        router.push("/");
      } else if (role === "DeliveryMan") {
        router.push("/delivery");
      } else {
        router.push("/login");
      }
    } else {
      fetchApprovedOrders();

      const dineEventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/approved/stream`
      );
      const onlineEventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/approved/cook/stream`
      );

      const handleDineOrderUpdate = (event: MessageEvent) => {
        const updatedOrder = JSON.parse(event.data);
        if (updatedOrder.table_number) {
          console.log("Received dine order update:", updatedOrder.order_id);
          setDineOrders((prevOrders) => handleOrderUpdate(prevOrders, updatedOrder, false));
        }
      };

      const handleOnlineOrderUpdate = (event: MessageEvent) => {
        const updatedOrder = JSON.parse(event.data);
        console.log("Received online order update:", updatedOrder.order_id, "DeliveryMan:", updatedOrder.deliverymanId);
        setOnlineOrders((prevOrders) => handleOrderUpdate(prevOrders, updatedOrder, true));
      };

      dineEventSource.onmessage = handleDineOrderUpdate;
      onlineEventSource.onmessage = handleOnlineOrderUpdate;

      dineEventSource.onerror = () => {
        console.error("Dine SSE error");
        dineEventSource.close();
      };
      onlineEventSource.onerror = () => {
        console.error("Online SSE error");
        onlineEventSource.close();
      };

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        dineEventSource.close();
        onlineEventSource.close();
      };
    }
  }, [router]);

  useEffect(() => {
    startPolling();
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [onlineOrders.length]);

  const isOrderDelayed = (orderTime: string): boolean => {
    const orderDate = new Date(orderTime);
    const twentyMinutesAgo = new Date(currentTime.getTime() - 20 * 60 * 1000);
    return orderDate < twentyMinutesAgo;
  };

  const OrderCard = ({
    order,
    isOnline = false,
  }: {
    order: Order;
    isOnline?: boolean;
  }) => (
    <div
      className={`p-4 rounded-lg ${
        isOrderDelayed(order.order_time)
          ? "border border-red-200 shadow-[0_0_1px_#fff,inset_0_0_1px_#fff,0_0_2px_#990000,0_0_4px_#990000,0_0_8px_#990000]"
          : "bg-gray-200"
      } mb-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300`}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">ID: {order.order_id.slice(-6)}</h3>
        {!isOnline && order.table_number && (
          <span className="text-sm font-semibold">
            Table: <strong>{order.table_number}</strong>
          </span>
        )}
      </div>
      <p className="text-gray-700 text-sm">
        {new Date(order.order_time).toLocaleTimeString()}
      </p>
      <div className="text-gray-700 text-sm">
        <span>User: {order.username}</span>
      </div>
      <div className="">
        <h4 className="font-semibold text-sm text-left">Items:</h4>
        <table className="w-full text-sm border-collapse">
          <tbody>
            {order.items.map((item) => (
              <tr key={item.item_id} className="border-b">
                <td className="text-left">{item.item_name}</td>
                <td className="text-center">{item.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isOrderDelayed(order.order_time) && (
        <p className="text-red-500 font-semibold mt-1 text-xs">
          Order delayed!
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-1 py-4">
        <div className="max-w-8xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-xl px-6 py-2 shadow-lg">
            <h2 className="text-base font-bold text-center text-white">
              Kitchen Orders
            </h2>
          </div>

          <div className="bg-white rounded-b-xl shadow-lg p-2">
            {error && (
              <p className="text-red-500 text-center mb-4">{error}</p>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 relative">
              {/* Dine Orders Section */}
              <div className="col-span-1 lg:col-span-3 lg:pr-0 lg:border-r lg:border-gray-800">
                <h3 className="font-semibold mb-4 text-center">Dine-in</h3>
                {dineOrders.length > 0 ? (
                  <Masonry
                    breakpointCols={dineBreakpointColumnsObj}
                    className="flex -ml-4 w-auto"
                    columnClassName="pl-4 bg-clip-padding"
                  >
                    {dineOrders.map((order) => (
                      <OrderCard key={order.order_id} order={order} />
                    ))}
                  </Masonry>
                ) : (
                  <p className="text-gray-500 text-center">No dine-in orders</p>
                )}
              </div>

              {/* Online Orders Section */}
              <div className="col-span-1 lg:col-span-2 lg:pl-0">
                <h3 className="font-semibold mb-4 text-center">Online</h3>
                {onlineOrders.length > 0 ? (
                  <Masonry
                    breakpointCols={onlineBreakpointColumnsObj}
                    className="flex -ml-4 w-auto"
                    columnClassName="pl-4 bg-clip-padding"
                  >
                    {onlineOrders.map((order) => (
                      <OrderCard
                        key={order.order_id}
                        order={order}
                        isOnline={true}
                      />
                    ))}
                  </Masonry>
                ) : (
                  <p className="text-gray-500 text-center">No online orders</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}