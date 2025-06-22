"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Image from "next/image";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      // Store token, username, and role in cookies
      Cookies.set("adminToken", data.token, { expires: 1 });
      Cookies.set("adminUsername", username, { expires: 1 });
      Cookies.set("adminRole", data.role, { expires: 1 });

      // Redirect based on role
      if (data.role === "Cook") {
        router.push("/cook");
      } else if (data.role === "Manager") {
        router.push("/today-orders");
      } else if (data.role === "SuperAdmin") {
        router.push("/");
      } else if (data.role === "DeliveryMan") {
        router.push("/deliver-order");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="bg-white p-12 rounded-lg shadow-md w-96 transform -translate-y-52">
        <div className="flex items-center justify-center mb-4">
          <Image
            src="/cmelogo.png"
            alt="Left Icon"
            width={28}
            height={28}
            className="pt-1 mr-14"
          />
         <h2 className="text-lg md:text-xl font-semibold text-center">Staff Login</h2>
          <Image
            src="/oilogo.png"
            alt="Right Icon"
            width={24}
            height={24}
            className="ml-14"
          />
        </div>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}