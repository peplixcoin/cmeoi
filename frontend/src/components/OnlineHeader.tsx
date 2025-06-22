"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useOnlineCart } from "@/context/OnlineCartContext";
import Image from "next/image";

export default function OnlineHeader() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const { cartCount, resetCartOnSignOut } = useOnlineCart();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const checkAuth = () => {
    const token = Cookies.get("token");
    setIsAuthenticated(!!token);
    if (token) {
      const user = Cookies.get("username") || "User";
      setUsername(user);
    }
  };

  useEffect(() => {
    checkAuth();
    const handleStorageChange = () => {
      checkAuth();
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cartUpdated", () => {});
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", () => {});
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleSignOut = () => {
    Cookies.remove("token");
    resetCartOnSignOut();
    setIsAuthenticated(false);
    setShowDropdown(false);
    router.push("/signin");
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const goBack = () => router.back();
  const goForward = () => router.forward();

  return (
    <div className="fixed top-4 left-0 right-0 z-50 w-full max-w-screen-lg mx-auto px-2 sm:px-4">
      <div className="flex items-center justify-between space-x-2 sm:space-x-4">
        {/* Back button */}
        <button
          onClick={goBack}
          className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full 
             border border-sky-200 
             backdrop-blur-sm bg-white/50 hover:bg-white/70 
             shadow-[0_0_1px_#fff,inset_0_0_1px_#fff,0_0_3px_#08f,0_0_6px_#08f,0_0_10px_#08f]
             transition-all flex-shrink-0"
          aria-label="Go back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Main navbar */}
        <header className="flex-1 min-w-0 
             shadow-[0_0_1px_#fff,inset_0_0_1px_#fff,0_0_3px_#08f,0_0_6px_#08f,0_0_10px_#08f] 
             backdrop-blur-sm bg-white/50 
             rounded-full border border-sky-200">
          <nav className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2 lg:px-8 lg:py-3">
             <Link href="/" className="flex items-center space-x-2 text-sm sm:text-base font-semibold text-gray-700 hover:text-gray-900 truncate" > <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} > <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> </svg> </Link>

            <div className="flex items-center">
              {isAuthenticated && (
                <>
                  <Link href="/online/cart" className="relative">
                    <span className="text-2xl">🛒</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/online/order"
                    className="text-sm sm:text-base text-gray-700 hover:text-gray-900 truncate ml-4"
                  >
                    My Orders
                  </Link>
                </>
              )}

              {isAuthenticated ? (
                <div className="relative ml-4" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs font-medium uppercase transition-all hover:bg-transparent focus:bg-transparent active:bg-transparent"
                  >
                    <div className="w-full h-full rounded-full bg-white/70 flex items-center justify-center shadow-sm border border-white/30">
                      <span className="text-lg sm:text-xl">👤</span>
                    </div>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white/90 rounded-md shadow-lg py-1 z-50 backdrop-blur-sm border border-white/20">
                      <div className="px-3 py-1.5 sm:px-4 sm:py-2 border-b border-gray-200/50">
                        <p className="text-xs sm:text-sm text-gray-700 truncate">Hi, {username}</p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100/50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-1 sm:space-x-2">
                  <Link
                    href="/signin"
                    className="py-1 px-2 sm:py-1.5 sm:px-4 text-xs sm:text-sm text-gray-700 bg-white/70 rounded-md hover:bg-white/90 transition border border-white/30 shadow-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="py-1 px-2 sm:py-1.5 sm:px-4 text-xs sm:text-sm text-white bg-gray-700/90 rounded-md hover:bg-gray-700 transition border border-gray-600/30 shadow-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </header>

        {/* Forward button */}
        <button
          onClick={goForward}
          className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full 
             border border-sky-200 
             backdrop-blur-sm bg-white/50 hover:bg-white/70 
             shadow-[0_0_1px_#fff,inset_0_0_1px_#fff,0_0_3px_#08f,0_0_6px_#08f,0_0_10px_#08f]
             transition-all flex-shrink-0"
          aria-label="Go forward"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}