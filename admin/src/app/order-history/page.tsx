"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
  order_status: "pending" | "approved" | "completed";
  payment_status: "pending" | "paid" | "failed";
  completion_time?: string;
}

interface OrderResponse {
  orders: Order[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dine" | "online">("dine");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "pending" | "approved" | "completed"
  >("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [monthlyFilteredOrders, setMonthlyFilteredOrders] = useState<Order[]>([]);
  const [dailyFilteredOrders, setDailyFilteredOrders] = useState<Order[]>([]);
  const [currentMonthData, setCurrentMonthData] = useState<OrderResponse>({
    orders: [],
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  });
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    const token = Cookies.get("adminToken");
    const role = Cookies.get("adminRole");

    if (!token) {
      router.push("/login");
    } else if (role !== "Manager" && activeTab === "dine") {
      if (role === "SuperAdmin") {
        router.push("/");
      } else if (role === "Cook") {
        router.push("/cook");
      } else {
        router.push("/login");
      }
    } else {
      fetchCurrentMonthOrders();
    }
  }, [router, activeTab]);

  const loadMoreOrders = () => {
    if (currentMonthData.page < currentMonthData.pages) {
      const nextPage = currentMonthData.page + 1;
      fetchCurrentMonthOrders(nextPage);
    }
  };

  const fetchCurrentMonthOrders = async (page = 1) => {
    try {
      setLoading(true);
      const endpoint =
        activeTab === "dine"
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/current-month?page=${page}&limit=10`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/current-month?page=${page}&limit=10`;
      const response = await fetch(endpoint);
      const data: OrderResponse = await response.json();

      setCurrentMonthData((prev) => ({
        ...data,
        orders: page === 1 ? data.orders : [...prev.orders, ...data.orders],
      }));
    } catch (error) {
      console.error("Error fetching current month orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyOrders = async (month: string) => {
    try {
      setLoading(true);
      const endpoint =
        activeTab === "dine"
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/month/${month}`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/month/${month}`;
      const response = await fetch(endpoint);
      const data = await response.json();
      setMonthlyFilteredOrders(data);
    } catch (error) {
      console.error("Error fetching monthly orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyOrders = async (date: string) => {
    try {
      setLoading(true);
      const endpoint =
        activeTab === "dine"
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/date/${date}`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/orders/online/date/${date}`;
      const response = await fetch(endpoint);
      const data = await response.json();
      setDailyFilteredOrders(data);
    } catch (error) {
      console.error("Error fetching daily orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = (
    status: "all" | "pending" | "approved" | "completed",
    ordersData?: Order[]
  ) => {
    const data = ordersData || orders;
    if (status === "all") {
      setFilteredOrders(data);
    } else {
      setFilteredOrders(data.filter((order) => order.order_status === status));
    }
    setSelectedStatus(status);
  };

  useEffect(() => {
    if (selectedMonth) {
      fetchMonthlyOrders(selectedMonth);
    } else {
      setMonthlyFilteredOrders([]);
    }
  }, [selectedMonth, activeTab]);

  useEffect(() => {
    if (selectedDate) {
      fetchDailyOrders(selectedDate);
    } else {
      setDailyFilteredOrders([]);
    }
  }, [selectedDate, activeTab]);

  useEffect(() => {
    setCurrentMonthData({
      orders: [],
      total: 0,
      page: 1,
      pages: 1,
      limit: 10,
    });
    setSelectedMonth("");
    setSelectedDate("");
    setSelectedOrder(null);
    setMonthlyFilteredOrders([]);
    setDailyFilteredOrders([]);
    fetchCurrentMonthOrders();
  }, [activeTab]);

  const downloadExcel = (ordersData: Order[], fileName: string) => {
    const data = ordersData.map((order) => ({
      "Order ID": order.order_id || "N/A",
      Username: order.username || "N/A",
      "Total Amount": order.total_amt?.toFixed(2) || "N/A",
      "Order Date": order.order_time
        ? new Date(order.order_time).toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "N/A",
      "Order Status": order.order_status || "N/A",
      "Payment Status": order.payment_status || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const downloadPDF = (ordersData: Order[], fileName: string) => {
    const doc = new jsPDF();
    const tableData = ordersData.map((order) => [
      order.order_id || "N/A",
      order.username || "N/A",
      order.total_amt?.toFixed(2) || "N/A",
      order.order_time
        ? new Date(order.order_time).toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "N/A",
      order.order_status || "N/A",
      order.payment_status || "N/A",
    ]);

    doc.text(fileName, 14, 10);
    (doc as any).autoTable({
      head: [
        [
          "Order ID",
          "Username",
          "Total Amount",
          "Order Date",
          "Order Status",
          "Payment Status",
        ],
      ],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
    });

    doc.save(`${fileName}.pdf`);
  };

  const handleGenerateMonthlyExcel = () => {
    if (!selectedMonth) {
      alert("Please select a month first!");
      return;
    }

    const validOrders = monthlyFilteredOrders.filter(
      (order) =>
        order.order_status === "completed" && order.payment_status === "paid"
    );

    if (validOrders.length === 0) {
      alert("No valid completed and paid orders found for this month.");
      return;
    }

    downloadExcel(
      validOrders,
      `${activeTab === "dine" ? "Dine-in" : "Online"}Orders_${selectedMonth}`
    );
  };

  const handleGenerateMonthlyPDF = () => {
    if (!selectedMonth) {
      alert("Please select a month first!");
      return;
    }

    const validOrders = monthlyFilteredOrders.filter(
      (order) =>
        order.order_status === "completed" && order.payment_status === "paid"
    );

    if (validOrders.length === 0) {
      alert("No valid completed and paid orders found for this month.");
      return;
    }

    const doc = new jsPDF();
    const tableData = validOrders.map((order) => [
      order.order_id,
      order.username,
      `${order.total_amt.toFixed(2)}`,
      new Date(order.order_time).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    ]);

    const totalSum = validOrders.reduce(
      (sum, order) => sum + order.total_amt,
      0
    );

    tableData.push(["", "TOTAL", `${totalSum.toFixed(2)}`, ""]);

    doc.text(
      `${activeTab === "dine" ? "Dine-in" : "Online"} Orders Report - ${selectedMonth}`,
      10,
      10
    );

    (doc as any).autoTable({
      head: [["ID", "Username", "Amount", "Date"]],
      body: tableData,
      startY: 20,
      didDrawPage: (data: any) => {
        doc.setFontSize(10);
      },
    });

    doc.save(
      `${activeTab === "dine" ? "Dine-in" : "Online"}Orders_Report_${selectedMonth}.pdf`
    );
  };

  const handleGenerateDailyExcel = () => {
    if (!selectedDate) {
      alert("Please select a date first!");
      return;
    }

    const validOrders = dailyFilteredOrders.filter(
      (order) =>
        order.order_status === "completed" && order.payment_status === "paid"
    );

    if (validOrders.length === 0) {
      alert("No valid completed and paid orders found for this date.");
      return;
    }

    downloadExcel(
      validOrders,
      `${activeTab === "dine" ? "Dine-in" : "Online"}Orders_${selectedDate}`
    );
  };

  const handleGenerateDailyPDF = () => {
    if (!selectedDate) {
      alert("Please select a date first!");
      return;
    }

    const validOrders = dailyFilteredOrders.filter(
      (order) =>
        order.order_status === "completed" && order.payment_status === "paid"
    );

    if (validOrders.length === 0) {
      alert("No valid completed and paid orders found for this date.");
      return;
    }

    const doc = new jsPDF();
    const tableData = validOrders.map((order) => [
      order.order_id,
      order.username,
      `${order.total_amt.toFixed(2)}`,
      new Date(order.order_time).toLocaleTimeString(),
    ]);

    const totalSum = validOrders.reduce(
      (sum, order) => sum + order.total_amt,
      0
    );

    tableData.push(["", "TOTAL", `${totalSum.toFixed(2)}`, ""]);

    doc.text(
      `${activeTab === "dine" ? "Dine-in" : "Online"} Orders Report - ${selectedDate}`,
      10,
      10
    );

    (doc as any).autoTable({
      head: [["ID", "Username", "Amount", "Time"]],
      body: tableData,
      startY: 20,
      didDrawPage: (data: any) => {
        doc.setFontSize(10);
      },
    });

    doc.save(
      `${activeTab === "dine" ? "Dine-in" : "Online"}Orders_Report_${selectedDate}.pdf`
    );
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-xl px-6 py-2 shadow-lg">
            <h1 className="text-base text-center font-bold text-white">Order Reports</h1>
          </div>
          <div className="bg-white rounded-b-xl shadow-lg p-6">
            <div className="flex justify-center mb-6 gap-2">
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 flex items-center ${
                  activeTab === "dine"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm"
                    : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setActiveTab("dine")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z"
                    clipRule="evenodd"
                  />
                </svg>
                Dine-in Orders
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 flex items-center ${
                  activeTab === "online"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm"
                    : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setActiveTab("online")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                Online Orders
              </button>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
              {activeTab === "dine" ? "Dine-in" : "Online"} Order History
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-xl font-medium text-gray-800 mb-4 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-gray-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Monthly Orders Report
                </h3>
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="pl-10 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                  />
                </div>
                {selectedMonth && (
                  <div className="flex justify-between mt-4 space-x-4">
                    <button
                      onClick={handleGenerateMonthlyExcel}
                      className={`w-full px-4 py-2 bg-green-500 text-white font-medium rounded-lg shadow-sm hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-150 flex items-center justify-center ${
                        monthlyFilteredOrders.length === 0 || isLoading
                          ? "opacity-75 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={monthlyFilteredOrders.length === 0 || isLoading}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Download Excel
                    </button>
                    <button
                      onClick={handleGenerateMonthlyPDF}
                      className={`w-full px-4 py-2 bg-red-500 text-white font-medium rounded-lg shadow-sm hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-150 flex items-center justify-center ${
                        monthlyFilteredOrders.length === 0 || isLoading
                          ? "opacity-75 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={monthlyFilteredOrders.length === 0 || isLoading}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Download PDF
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-xl font-medium text-gray-800 mb-4 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-gray-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Daily Orders Report
                </h3>
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                  />
                </div>
                {selectedDate && (
                  <div className="flex justify-between mt-4 space-x-4">
                    <button
                      onClick={handleGenerateDailyExcel}
                      className={`w-full px-4 py-2 bg-green-500 text-white font-medium rounded-lg shadow-sm hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-150 flex items-center justify-center ${
                        dailyFilteredOrders.length === 0 || isLoading
                          ? "opacity-75 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={dailyFilteredOrders.length === 0 || isLoading}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Download Excel
                    </button>
                    <button
                      onClick={handleGenerateDailyPDF}
                      className={`w-full px-4 py-2 bg-red-500 text-white font-medium rounded-lg shadow-sm hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-150 flex items-center justify-center ${
                        dailyFilteredOrders.length === 0 || isLoading
                          ? "opacity-75 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={dailyFilteredOrders.length === 0 || isLoading}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Download PDF
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
              {new Date().toLocaleString("default", { month: "long" })} Orders
            </h2>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : currentMonthData.orders.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentMonthData.orders.map((order) => (
                    <div
                      key={order.order_id}
                      className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-800">
                          ID: {order.order_id}
                        </h3>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            User: {order.username}
                          </p>
                          <p className="flex items-center">
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
                            Time: {new Date(order.order_time).toLocaleString()}
                          </p>
                          <p className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 4h8a1 1 0 110 2H6a1 1 0 110-2zm0 3h8a1 1 0 110 2H6a1 1 0 110-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Total: ₹{order.total_amt}
                          </p>
                          <p className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                              <path
                                fillRule="evenodd"
                                d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Payment: {order.payment_status}
                          </p>
                          <p className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Order: {order.order_status}
                          </p>
                        </div>
                        <div className="flex justify-end mt-2">
                          <button
                            className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg shadow-sm hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-150 flex items-center"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path
                                fillRule="evenodd"
                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {currentMonthData.page < currentMonthData.pages && (
                  <button
                    onClick={loadMoreOrders}
                    className="mt-6 w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg shadow-sm hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-150 flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Load More
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-800">No orders available</h3>
                <p className="text-gray-500 mt-1">There are no orders for this month.</p>
              </div>
            )}

            {selectedOrder && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
                  <button
                    className="absolute top-3 right-3 bg-gray-50 rounded-full p-2 text-gray-600 hover:bg-gray-100 transition-all duration-150"
                    onClick={() => setSelectedOrder(null)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <h3 className="text-xl font-medium text-gray-800 mb-4">Order Details</h3>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items.map((item) => (
                          <tr key={item.item_id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-700">{item.item_name}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{item.qty}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">₹{item.item_price}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">₹{item.total_price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}