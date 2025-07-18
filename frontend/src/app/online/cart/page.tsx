
"use client";

import { useOnlineCart } from "@/context/OnlineCartContext";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function OnlineCartPage() {
  const { cart, removeFromCart, clearCart, incrementQuantity, decrementQuantity } = useOnlineCart();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [userMobileNo, setUserMobileNo] = useState("");
  const [useTempAddress, setUseTempAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState("");
  const [useTempMobileNo, setUseTempMobileNo] = useState(false);
  const [tempMobileNo, setTempMobileNo] = useState("");
  const router = useRouter();

  useEffect(() => {
    const storedUsername = Cookies.get("username");
    if (typeof storedUsername === "string") {
      setUsername(storedUsername);
      fetchUserDetails(storedUsername);
    }
  }, []);

  const fetchUserDetails = async (username: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${username}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to fetch user details");
      const userData = await response.json();
      setUserAddress(userData.address || "No address set");
      setUserMobileNo(userData.mobile_no || "No mobile number set");
    } catch (error: unknown) {
      console.error("Error fetching user details:", error);
      setUserAddress("Error fetching address");
      setUserMobileNo("Error fetching mobile number");
    }
  };

  const toggleTempAddress = () => {
    setUseTempAddress(!useTempAddress);
    if (useTempAddress) {
      setTempAddress("");
    }
  };

  const toggleTempMobileNo = () => {
    setUseTempMobileNo(!useTempMobileNo);
    if (useTempMobileNo) {
      setTempMobileNo("");
    }
  };

  const isValidMobileNo = (mobileNo: string) => {
    const mobileNoRegex = /^\d{10}$/;
    return mobileNoRegex.test(mobileNo);
  };

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

    const selectedAddress = useTempAddress ? tempAddress.trim() : userAddress;
    const selectedMobileNo = useTempMobileNo ? tempMobileNo.trim() : userMobileNo;

    if (!selectedAddress || selectedAddress === "No address set" || selectedAddress === "Error fetching address") {
      alert("Please provide a valid address or update your profile!");
      return;
    }

    if (!selectedMobileNo || selectedMobileNo === "No mobile number set" || selectedMobileNo === "Error fetching mobile number") {
      alert("Please provide a valid mobile number or update your profile!");
      return;
    }

    if (useTempMobileNo && !isValidMobileNo(selectedMobileNo)) {
      alert("Please enter a valid 10-digit mobile number!");
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
      order_time: new Date(),
      address: selectedAddress,
      mobile_no: selectedMobileNo,
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/online/placeorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) throw new Error("Failed to place order");

      clearCart();
      setTempAddress("");
      setUseTempAddress(false);
      setTempMobileNo("");
      setUseTempMobileNo(false);
      router.push("/online/order");
    } catch (error: unknown) {
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
          <h1 className="text-xl md:text-xl font-bold text-center text-white">Online Order Cart</h1>
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
              onClick={() => router.push("/online/menu")} 
              className="bg-indigo-600 text-white px-8 py-3 rounded-full hover:bg-indigo-700 transition-colors duration-300 font-medium"
            >
              Go to Menu
            </button>
          </div>
        ) : (
          <div className="p-6">
            {/* Delivery info */}
            <div className="mb-8 bg-indigo-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Delivery Information</h2>
              
              {/* Address section */}
              <div className="mb-6 space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-700">Delivery Address</p>
                    <p className="text-gray-600 mt-1">
                      {useTempAddress ? (tempAddress || "Enter temporary address") : userAddress}
                      {userAddress === "No address set" && !useTempAddress && (
                        <span className="text-red-500 text-sm block mt-1">Please update your profile or use a temporary address</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="ml-8">
                  <button
                    onClick={toggleTempAddress}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
                      useTempAddress 
                        ? "bg-gray-200 text-gray-800 hover:bg-gray-300" 
                        : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    }`}
                  >
                    {useTempAddress ? "Use Saved Address" : "Use Different Address"}
                  </button>
                </div>
                {useTempAddress && (
                  <div className="ml-8 mt-2">
                    <input
                      type="text"
                      id="tempAddress"
                      value={tempAddress}
                      onChange={(e) => setTempAddress(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all duration-300"
                      placeholder="Enter temporary delivery address"
                    />
                  </div>
                )}
              </div>
              
              {/* Mobile number section */}
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-700">Mobile Number</p>
                    <p className="text-gray-600 mt-1">
                      {useTempMobileNo ? (tempMobileNo || "Enter temporary mobile number") : userMobileNo}
                      {userMobileNo === "No mobile number set" && !useTempMobileNo && (
                        <span className="text-red-500 text-sm block mt-1">Please update your profile or use a temporary mobile number</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="ml-8">
                  <button
                    onClick={toggleTempMobileNo}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
                      useTempMobileNo 
                        ? "bg-gray-200 text-gray-800 hover:bg-gray-300" 
                        : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    }`}
                  >
                    {useTempMobileNo ? "Use Saved Mobile Number" : "Use Different Mobile Number"}
                  </button>
                </div>
                {useTempMobileNo && (
                  <div className="ml-8 mt-2">
                    <input
                      type="text"
                      id="tempMobileNo"
                      value={tempMobileNo}
                      onChange={(e) => setTempMobileNo(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all duration-300"
                      placeholder="Enter temporary mobile number (10 digits)"
                    />
                  </div>
                )}
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