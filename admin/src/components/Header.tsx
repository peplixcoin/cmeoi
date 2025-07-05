// src/components/Header.tsx

"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { useEffect, useState, useRef } from "react";
import { Menu, X, User } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("Admin");
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = Cookies.get("adminToken");
    const storedUsername = Cookies.get("adminUsername");
    const storedRole = Cookies.get("adminRole");
    setAdminToken(token || null);
    setUsername(storedUsername || "Admin");
    setRole(storedRole || null);
  }, [pathname]);

  const handleLogout = () => {
    Cookies.remove("adminToken");
    Cookies.remove("adminUsername");
    Cookies.remove("adminRole");
    setAdminToken(null);
    setUsername("Admin");
    setRole(null);
    setMenuOpen(false);
    setDropdownOpen(false);
    router.push("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (menuOpen || dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, dropdownOpen]);

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  const goBack = () => router.back();
  const goForward = () => router.forward();

  // Navigation items based on role
  const getNavItems = () => {
    if (!role) return [];

    if (role === "SuperAdmin") {
      return [
        { href: "/", label: "OI" },
        { href: "/menu", label: "Menu" },
        { href: "/events", label: "Events" },
        { href: "/event-approval", label: "Events Approval" },
        { href: "/lounges", label: "Lounges" },
        { href: "/lounge-bookings", label: "Lounge Bookings" },
        { href: "/order-feedback", label: "Feedback" },
        { href: "/instruction", label: "Announcements" },
      ];
    } else if (role === "Manager") {
      return [
        { href: "/today-orders", label: "TodayOrders" },
        { href: "/order-history", label: "Order History" },
        { href: "/edit-menu", label: "Edit Menu" },
        { href: "/cook", label: "Cook" },
        { href: "/manage-delivery", label: "Delivery" },
      ];
    } else if (role === "Cook") {
      return [
        { href: "/cook", label: "Cook" },
      ];
    }
    else if (role === "DeliveryMan") {
      return [
        { href: "/deliver-order", label: "Deliver Orders" },
      ];
    }
    else if (role === "TicketScanner") {
  return [
    { href: "/ticket-scanner", label: "Ticket Scanner" },
  ];
}
    return [];
  };

  const navItems = getNavItems();

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
        <header
          className="flex-1 min-w-0 
             shadow-[0_0_1px_#fff,inset_0_0_1px_#fff,0_0_3px_#08f,0_0_6px_#08f,0_0_10px_#08f] 
             backdrop-blur-sm bg-white/50 
             rounded-full border border-sky-200"
        >
          <nav className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2 lg:px-8 lg:py-3">
            {navItems.length > 0 && (
                <Link
  href={navItems[0].href}
  className="flex items-center space-x-2 text-sm sm:text-base font-semibold text-gray-700 hover:text-gray-900 truncate"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 sm:h-7 sm:w-7"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
</Link>
                
             
            )}

            <div className="flex items-center">
              <button
                className="md:hidden p-1 rounded-md focus:outline-none"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle navigation menu"
              >
                {menuOpen ? (
                  <X size={20} className="text-gray-700" />
                ) : (
                  <Menu size={20} className="text-gray-700" />
                )}
              </button>

              <div className="hidden md:flex items-center">
                {adminToken ? (
                  <>
                    {navItems.slice(1).map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="text-sm sm:text-base text-gray-700 hover:text-gray-900 truncate ml-4"
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="relative ml-4" ref={dropdownRef}>
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs font-medium uppercase transition-all hover:bg-transparent focus:bg-transparent active:bg-transparent"
                      >
                        <div className="w-full h-full rounded-full bg-white/70 flex items-center justify-center shadow-sm border border-white/30">
                          <User size={16} className="text-gray-700" />
                        </div>
                      </button>

                      {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white/90 rounded-md shadow-lg py-1 z-50 backdrop-blur-sm border border-white/20">
                          <div className="px-3 py-1.5 sm:px-4 sm:py-2 border-b border-gray-200/50">
                            <p className="text-xs sm:text-sm text-gray-700 truncate">
                              Hi, {username} ({role})
                            </p>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100/50"
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex space-x-1 sm:space-x-2">
                    <Link
                      href="/login"
                      className="py-1 px-2 sm:py-1.5 sm:px-4 text-xs sm:text-sm text-gray-700 bg-white/70 rounded-md hover:bg-white/90 transition border border-white/30 shadow-sm"
                    >
                      Login
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* Mobile menu */}
          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute top-full left-0 right-0 mt-2 bg-white/90 rounded-lg shadow-lg py-2 z-50 backdrop-blur-sm border border-white/20 md:hidden"
            >
              {adminToken ? (
                <>
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/50"
                      onClick={handleMenuClose}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/50"
                  onClick={handleMenuClose}
                >
                  Login
                </Link>
              )}
            </div>
          )}
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