"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";

export default function HelpForm() {
  const [result, setResult] = useState("");
  const [username, setUsername] = useState("");

  // Fetch username from cookies on component mount
  useEffect(() => {
    const storedUsername = Cookies.get("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult("Sending....");
    const formData = new FormData(event.target as HTMLFormElement);

    formData.append("access_key", "ccb43850-1e31-4da5-a438-2562571fa83c"); // Replace with your Web3Forms access key

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult("Issue Submitted Successfully");
        (event.target as HTMLFormElement).reset();
        setUsername(Cookies.get("username") || ""); // Reset username to cookie value after form reset
      } else {
        console.log("Error", data);
        setResult(data.message);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setResult("An error occurred. Please try again.");
    }
  };

  return (
    <div className="px-4 sm:px-6 min-h-screen">
      <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white/90 rounded-2xl shadow-lg backdrop-blur-sm border border-gray-200 my-10">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl px-6 py-2 mb-4 shadow-lg">
          <h1 className="text-base text-center font-bold text-white">Contact Support</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm sm:text-base font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={username}
              readOnly
              aria-label="Your name"
              className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg bg-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-300"
              placeholder={username ? "" : "Username not found"}
            />
          </div>

          {/* Mobile Number Field */}
          <div>
            <label
              htmlFor="mobile"
              className="block text-sm sm:text-base font-medium text-gray-700 mb-1"
            >
              Mobile Number
            </label>
            <input
              type="tel"
              name="mobile"
              id="mobile"
              required
              pattern="[0-9]{10}"
              aria-label="Your mobile number"
              className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-300"
              placeholder="Enter your mobile number"
            />
          </div>

          {/* App Selection Field */}
          <div>
            <label
              htmlFor="app"
              className="block text-sm sm:text-base font-medium text-gray-700 mb-1"
            >
              App/Service
            </label>
            <div className="relative">
              <select
                name="app"
                id="app"
                required
                defaultValue=""
                aria-label="Select an app or service"
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 appearance-none transition-all duration-300 cursor-pointer"
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option value="dine-in">Dine-In</option>
                <option value="order-online">Order Online</option>
                <option value="event">Event Booking</option>
                <option value="guest-room">Lounge Booking</option>
              </select>
              <svg
                className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-5 sm:w-6 h-5 sm:h-6 text-gray-500 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Issue Field */}
          <div>
            <label
              htmlFor="issue"
              className="block text-sm sm:text-base font-medium text-gray-700 mb-1"
            >
              Issue
            </label>
            <textarea
              name="issue"
              id="issue"
              required
              rows={4}
              aria-label="Describe your issue"
              className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-300"
              placeholder="Describe your issue"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-1/2 py-3 sm:py-4 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-all duration-300 font-medium text-sm sm:text-base"
              aria-label="Submit support request"
            >
              Submit
            </button>
          </div>
        </form>

        {/* Result Message */}
        {result && (
          <div
            className={`mt-6 p-4 rounded-lg text-center text-sm sm:text-base font-semibold ${
              result.includes("Success")
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {result}
          </div>
        )}
      </div>
    </div>
  );
}