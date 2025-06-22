"use client";

import { useDineCart } from "@/context/DineCartContext";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function DineCartPage() {
  const { cart, removeFromCart, clearCart, incrementQuantity, decrementQuantity } = useDineCart();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [tableNumber, setTableNumber] = useState(1);
  const router = useRouter(); 

  useEffect(() => {
    const storedUsername = Cookies.get("username");
    if (storedUsername) setUsername(storedUsername);
  }, []);

  const totalAmount = cart.reduce((total, item) => total + item.item_price * item.quantity, 0);

  const placeOrder = async () => {
    if (!username) {
      alert("You must be logged in to place an order!");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const isConfirmed = window.confirm(
      `Confirm Order`
    );

    if (!isConfirmed) return;

    setLoading(true);

    const orderData = {
      order_id: `ORD-${Date.now()}`,
      username,
      table_number: tableNumber,
      order_time: new Date(),
      items: cart.map(item => ({
        item_id: item.item_id,
        item_name: item.item_name,
        qty: item.quantity,
        item_price: item.item_price,
        total_price: item.item_price * item.quantity,
      })),
      total_amt: totalAmount,
      order_status: "pending",
      payment_status: "pending",
      completion_time: null,
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/placeorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error("Failed to place order");

      clearCart();
      router.push("/dine/order");
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Error placing order. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Cart header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4">
          <h1 className="text-xl md:text-xl text-center font-bold text-white">Dine-In Cart</h1>
          <p className="text-indigo-100 text-center mt-1">
            {cart.length === 0 
              ? "Your cart is waiting to be filled"
              : `${cart.length} item${cart.length > 1 ? 's' : ''} in your cart`
            }
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-6 text-center">Your cart is empty. Add some delicious items to get started!</p>
            <button 
              onClick={() => router.push("/dine/menu")} 
              className="bg-indigo-600 text-white px-8 py-3 rounded-full hover:bg-indigo-700 transition-colors duration-300 font-medium"
            >
              Go to Menu
            </button>
          </div>
        ) : (
          <div className="p-6">
            {/* Table number section */}
            <div className="mb-8 bg-indigo-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Dining Information</h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <label htmlFor="tableNumber" className="font-medium text-gray-700">Table Number</label>
                    <select
                      id="tableNumber"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(parseInt(e.target.value))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all duration-300 mt-1"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          Table {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Cart items */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
              <div className="overflow-hidden border border-gray-200 rounded-xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700 text-left text-sm">
                        <th className="px-6 py-4 font-medium">Item</th>
                        <th className="px-6 py-4 font-medium">Price</th>
                        <th className="px-6 py-4 font-medium">Quantity</th>
                        <th className="px-6 py-4 font-medium">Total</th>
                        <th className="px-6 py-4 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {cart.map((item) => (
                        <tr key={item.item_id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{item.item_name}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">₹{item.item_price}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <button 
                                onClick={() => decrementQuantity(item.item_id)} 
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                                disabled={item.quantity === 1}
                              >
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="text-gray-800 font-medium">{item.quantity}</span>
                              <button 
                                onClick={() => incrementQuantity(item.item_id)} 
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">₹{item.item_price * item.quantity}</td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => removeFromCart(item.item_id)} 
                              className="text-red-500 hover:text-red-700 transition-colors duration-200"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Order total */}
            <div className="mb-8 bg-gray-50 rounded-xl p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600">Subtotal</p>
                  <p className="text-gray-900 text-2xl font-bold mt-1">₹{totalAmount}</p>
                </div>
                <div className="flex flex-col space-y-2">
                  <button 
                    onClick={clearCart} 
                    className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-medium hover:bg-red-200 transition-colors duration-300"
                  >
                    Clear Cart
                  </button>
                  <button 
                    onClick={placeOrder} 
                    className={`bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors duration-300 flex items-center justify-center ${loading ? 'opacity-80 cursor-not-allowed' : ''}`} 
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Placing Order...
                      </span>
                    ) : "Place Order"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}