"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import jsPDF from "jspdf";
import { Star, FileText, Clock, Package, ShoppingBag, MessageSquare, CreditCard } from "lucide-react";
import autoTable from "jspdf-autotable";
import { useRouter } from "next/navigation";

interface OrderItem {
  item_id: string;
  item_name: string;
  qty: number;
  item_price: number;
  total_price: number;
}

interface Order {
  order_id: string;
  order_time: string;
  items: OrderItem[];
  total_amt: number;
  order_status: string;
  payment_status: string;
}

interface Feedback {
  username: string;
  order_id: string;
  ratings: {
    taste: number;
    service: number;
    hygiene: number;
    behavior: number;
  };
  comment: string;
}

export default function DineOrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "completed">("all");
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratings, setRatings] = useState({
    taste: 0,
    service: 0,
    hygiene: 0,
    behavior: 0,
  });
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const router = useRouter();

  useEffect(() => {
    const username = Cookies.get("username");
    if (!username) {
      setError("User not logged in");
      setLoading(false);
      router.push("/signin");
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${username}/latest`
        );
        if (!response.ok) throw new Error("Failed to fetch orders");
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError("Error fetching orders");
      } finally {
        setLoading(false);
      }
    };

    const fetchFeedback = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/feedback/${username}`
        );
        if (!response.ok) throw new Error("Failed to fetch feedback");
        const data = await response.json();
        setFeedbackList(data);
      } catch (err) {
        console.error("Error fetching feedback:", err);
      }
    };

    fetchOrders();
    fetchFeedback();

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${username}/stream`
    );

    eventSource.onmessage = (event) => {
      const updatedOrder = JSON.parse(event.data);
      setOrders((prevOrders) => {
        const updatedOrders = prevOrders.map((order) =>
          order.order_id === updatedOrder.order_id ? updatedOrder : order
        );
        return updatedOrders;
      });
    };

    eventSource.onerror = (error) => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Order Pending';
      case 'approved': return 'Preparing';
      case 'completed': return 'Served';
      default: return status;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Payment Pending';
      case 'paid': return 'Paid';
      default: return status;
    }
  };

  const downloadReceipt = (order: Order) => {
    const pdf = new jsPDF();

    pdf.setFontSize(18);
    pdf.text("Order Receipt", 14, 20);

    pdf.setFontSize(12);
    pdf.text(`Order ID: ${order.order_id}`, 14, 30);
    pdf.text(
      `Order Date: ${new Date(order.order_time).toLocaleString()}`,
      14,
      40
    );
    pdf.text("===========================================", 14, 50);

    const tableData = order.items.map((item) => [
      item.item_name,
      item.qty,
      `₹${item.item_price.toFixed(2)}`,
      `₹${item.total_price.toFixed(2)}`,
    ]);

    autoTable(pdf, {
      startY: 60,
      head: [["Item Name", "Qty", "Price", "Total"]],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    const finalY = (pdf as any).lastAutoTable.finalY || 60;
    pdf.text("===========================================", 14, finalY + 10);
    pdf.text(`Total Amount: ₹${order.total_amt.toFixed(2)}`, 14, finalY + 20);
    pdf.text(`Order Status: ${getOrderStatusLabel(order.order_status)}`, 14, finalY + 30);
    pdf.text(`Payment Status: ${getPaymentStatusLabel(order.payment_status)}`, 14, finalY + 40);
    pdf.text("Thank you for dining with us!", 14, finalY + 60);

    pdf.save(`Receipt_${order.order_id}.pdf`);
  };

  const initiateUPIPayment = (order: Order) => {
    const amount = order.total_amt.toFixed(2);
    const upiId = "simran905690@axl"; // Replace with your actual UPI ID
    const note = `Payment for order #${order.order_id.slice(-6)}`;
    
    // Create UPI payment URL
    const upiUrl = `upi://pay?pa=${upiId}&pn=Restaurant%20Name&am=${amount}&tn=${encodeURIComponent(note)}&cu=INR`;
    
    // For web fallback
    const webUrl = `https://upayi.in/pay?pa=${upiId}&pn=Restaurant%20Name&am=${amount}&tn=${encodeURIComponent(note)}&cu=INR`;
    
    // Try to open UPI app
    window.location.href = upiUrl;
    
    // Fallback if UPI app not available
    setTimeout(() => {
      window.open(webUrl, '_blank');
    }, 500);
  };

  const handleFeedbackSubmit = async (orderId: string) => {
    const username = Cookies.get("username");

    if (!username) {
      alert("User not logged in");
      return;
    }

    const feedbackPayload: Feedback = {
      username,
      order_id: orderId,
      ratings,
      comment,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/feedback/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(feedbackPayload),
        }
      );

      if (!response.ok) throw new Error("Failed to submit feedback");
      setFeedbackModalOpen(false);
      setRatings({
        taste: 0,
        service: 0,
        hygiene: 0,
        behavior: 0,
      });
      setComment("");

      const feedbackResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/feedback/${username}`
      );
      if (!feedbackResponse.ok) throw new Error("Failed to fetch feedback");
      const updatedFeedbackList = await feedbackResponse.json();
      setFeedbackList(updatedFeedbackList);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Error submitting feedback");
    }
  };

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => order.order_status === filter);

  const hasFeedback = (orderId: string) => {
    return feedbackList.some((feedback) => feedback.order_id === orderId);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    return status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen py-4 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl px-6 py-2 mb-4 shadow-lg">
            <h1 className="text-base text-center font-bold text-white ">Dine-in Orders</h1>
          </div>

        <div className="bg-white rounded-xl shadow-sm mb-4 p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {["all", "pending", "approved", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`flex items-center justify-center px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                  filter === status
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "all" && <ShoppingBag className="mr-1 w-4 h-4" />}
                {status === "pending" && <Clock className="mr-1 w-4 h-4" />}
                {status === "approved" && <Package className="mr-1 w-4 h-4" />}
                {status === "completed" && <FileText className="mr-1 w-4 h-4" />}
                <span className="truncate">
                  {status === "all" ? "All Orders" : getOrderStatusLabel(status)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}
        
        {error && !loading && (
          <div className="bg-red-50 p-4 rounded-lg text-center text-red-600 text-sm sm:text-base mb-6">
            <p>{error}</p>
          </div>
        )}

        {filteredOrders.length === 0 && !loading && !error && (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center">
            <ShoppingBag className="mx-auto mb-4 text-gray-400 w-12 h-12 sm:w-16 sm:h-16" />
            <p className="text-gray-600 text-base sm:text-lg">No orders found in this category.</p>
          </div>
        )}

        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.order_id}
              className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                      <span className="text-xs bg-indigo-100 text-indigo-800 rounded-full px-2 py-1 mr-2">
                        #{order.order_id.slice(-6)}
                      </span>
                      Order Details
                    </h2>
                    <p className="text-gray-500 text-xs sm:text-sm flex items-center mt-1">
                      <Clock className="inline mr-1 w-4 h-4" />
                      {new Date(order.order_time).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                      {getOrderStatusLabel(order.order_status)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                      {getPaymentStatusLabel(order.payment_status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 rounded-tl-lg w-1/2">Item</th>
                        <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 text-center w-1/6">Qty</th>
                        <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 text-right w-1/6">Price</th>
                        <th className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 text-right rounded-tr-lg w-1/6">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {order.items.map((item, index) => (
                        <tr key={item.item_id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800">{item.item_name}</td>
                          <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800 text-center">{item.qty}</td>
                          <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800 text-right">₹{item.item_price.toFixed(2)}</td>
                          <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800 text-right font-medium">₹{item.total_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-indigo-50">
                        <td colSpan={3} className="px-2 sm:px-4 py-2 text-right font-semibold text-xs sm:text-sm text-gray-700">Total Amount:</td>
                        <td className="px-2 sm:px-4 py-2 text-right font-bold text-xs sm:text-sm text-indigo-700">₹{order.total_amt.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {order.order_status === "completed" && (
                  <div className="mt-3 flex flex-row gap-2 justify-end">
                    {order.payment_status === "paid" ? (
                      <>
                        <button
                          onClick={() => downloadReceipt(order)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 flex items-center shadow-sm"
                        >
                          <FileText className="mr-1 w-4 h-4" />
                          Receipt
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrderId(order.order_id);
                            setFeedbackModalOpen(true);
                          }}
                          className={`bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 flex items-center shadow-sm ${
                            hasFeedback(order.order_id) ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={hasFeedback(order.order_id)}
                        >
                          <MessageSquare className="mr-1 w-4 h-4" />
                          {hasFeedback(order.order_id) ? "Feedback Submitted" : "Feedback"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => initiateUPIPayment(order)}
                          className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 flex items-center shadow-sm"
                        >
                          <CreditCard className="mr-1 w-4 h-4" />
                          Pay Now
                        </button>
                        <button
                          onClick={() => downloadReceipt(order)}
                          className="bg-gray-600 hover:bg-gray-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 flex items-center shadow-sm"
                        >
                          <FileText className="mr-1 w-4 h-4" />
                          Bill
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-8 sm:mt-12">
          <button
            onClick={() => router.push("/dine/order-history")}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold text-sm sm:text-base px-6 sm:px-8 py-2 sm:py-3 rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
          >
            View All Orders History
          </button>
        </div>

        {feedbackModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 text-center border-b border-gray-100 pb-2">
                Your Feedback
              </h2>

              <div className="space-y-4 mb-6">
                <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
                  <label className="block text-xs sm:text-sm font-semibold text-orange-700 mb-2">
                    Food Taste
                  </label>
                  <div className="flex gap-1 sm:gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={`taste-${star}`}
                        size={20}
                        className={`cursor-pointer transition-all ${
                          star <= ratings.taste ? "text-orange-500" : "text-gray-300"
                        }`}
                        onClick={() => setRatings({ ...ratings, taste: star })}
                        fill={star <= ratings.taste ? "#f97316" : "none"}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <label className="block text-xs sm:text-sm font-semibold text-blue-700 mb-2">
                    Service Quality
                  </label>
                  <div className="flex gap-1 sm:gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={`service-${star}`}
                        size={20}
                        className={`cursor-pointer transition-all ${
                          star <= ratings.service ? "text-blue-500" : "text-gray-300"
                        }`}
                        onClick={() => setRatings({ ...ratings, service: star })}
                        fill={star <= ratings.service ? "#3b82f6" : "none"}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                  <label className="block text-xs sm:text-sm font-semibold text-green-700 mb-2">
                    Food Hygiene
                  </label>
                  <div className="flex gap-1 sm:gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={`hygiene-${star}`}
                        size={20}
                        className={`cursor-pointer transition-all ${
                          star <= ratings.hygiene ? "text-green-500" : "text-gray-300"
                        }`}
                        onClick={() => setRatings({ ...ratings, hygiene: star })}
                        fill={star <= ratings.hygiene ? "#22c55e" : "none"}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                  <label className="block text-xs sm:text-sm font-semibold text-purple-700 mb-2">
                    Staff Behavior
                  </label>
                  <div className="flex gap-1 sm:gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={`behavior-${star}`}
                        size={20}
                        className={`cursor-pointer transition-all ${
                          star <= ratings.behavior ? "text-purple-500" : "text-gray-300"
                        }`}
                        onClick={() => setRatings({ ...ratings, behavior: star })}
                        fill={star <= ratings.behavior ? "#a855f7" : "none"}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  Additional Comments
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm h-20 sm:h-24 resize-none text-sm sm:text-base"
                  placeholder="Tell us about your experience..."
                />
              </div>
              
              <div className="flex justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => setFeedbackModalOpen(false)}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 text-xs sm:text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleFeedbackSubmit(selectedOrderId!)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}