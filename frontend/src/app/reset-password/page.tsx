"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Handle redirect after successful password reset
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        router.push("/signin");
      }, 5000); // Redirect after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [message, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Username: username,
          email: email,
          mobile_no: mobileNo,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message + " Redirecting to login in 5 seconds...");
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center pt-20 min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg w-[90%] max-w-md mx-8">
        <div className="flex items-center justify-between mb-4">
  <Image
    src="/cmelogo.png"
    alt="Left Icon"
    width={28}
    height={28}
    className="pt-1"
  />
  <h1 className="text-lg md:text-xl font-bold text-center flex-grow text-center">
    Reset Password
  </h1>
  <Image
    src="/oilogo.png"
    alt="Right Icon"
    width={24}
    height={24}
  />
</div>

        <p className="text-center mb-6 text-gray-600">
          Enter your details to receive a new password
        </p>

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Mobile Number"
            value={mobileNo}
            onChange={(e) => setMobileNo(e.target.value)}
            required
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-white transition ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isLoading ? "Processing..." : "Reset Password"}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link href="/signin" className="text-blue-500 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}