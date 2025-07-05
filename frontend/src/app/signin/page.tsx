"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Username: username, Password: password }),
      });

      const data = await response.json();

      if (response.ok) {
        Cookies.set("token", data.token);
        Cookies.set("username", username);
        window.dispatchEvent(new Event("storage"));
        router.push("/");
      } else {
        setError(data.message);
      }
    } catch {
      setError("Sign-in failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center pt-20 min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg w-[90%] max-w-md mx-8">
        <div className="flex items-center justify-center mb-4">
          <img
            src="/cmelogo.png"
            alt="Left Icon"
            width={28}
            height={28}
            className="pt-1 mr-14"
          />
          <h1 className="text-lg md:text-xl font-bold text-center">Login</h1>
          <img
            src="/oilogo.png"
            alt="Right Icon"
            width={24}
            height={24}
            className="ml-14"
          />
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}

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
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition"
          >
            Login
          </button>
        </form>

        <p className="text-center mt-4">
          Don&rsquo;t have password?{" "}
          <a href="/reset-password" className="text-blue-500 hover:underline">
            Reset Password
          </a>
        </p>
      </div>
    </div>
  );
}
