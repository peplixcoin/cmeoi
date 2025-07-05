"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [userCounts, setUserCounts] = useState<{
    members: number;
    guests: number;
    total: number;
  }>({ members: 0, guests: 0, total: 0 });
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get("adminToken");
    const storedRole = Cookies.get("adminRole");

    if (!token) {
      router.push("/login");
    } else if (storedRole !== "SuperAdmin") {
      // Redirect to default page based on role
      if (storedRole === "Manager") {
        router.push("/today-orders");
      } else if (storedRole === "Cook") {
        router.push("/cook");
      } else if (storedRole === "TicketScanner") {
        router.push("/ticket-scanner");
      } else {
        router.push("/login");
      }
    } else {
      // Fetch user counts for SuperAdmin
      const fetchUserCounts = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/count`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch user counts");
          }
          const data = await response.json();
          setUserCounts(data);
        } catch (error) {
          console.error("Error fetching user counts:", error);
          setError(error instanceof Error ? error.message : "An error occurred while fetching user counts");
        } finally {
          setLoading(false);
        }
      };
      fetchUserCounts();
    }
  }, [router]);

  // Navigation items for SuperAdmin with unique gradient classes
  const navItems = [
    {
      href: "/users",
      label: "Users",
      description: `Total: ${userCounts.total || 0} (Members: ${userCounts.members || 0}, Guests: ${userCounts.guests || 0})`,
      disabled: false,
      gradient: "from-blue-500/80 to-blue-700/90",
    },
    {
      href: "/menu",
      label: "Menu",
      description: "Manage restaurant menu items",
      gradient: "from-green-500/80 to-green-700/90",
    },
    {
      href: "/events",
      label: "Events",
      description: "Manage events",
      gradient: "from-purple-500/80 to-purple-700/90",
    },
    {
      href: "/event-approval",
      label: "Events Approval",
      description: "Review and approve event registrations",
      gradient: "from-red-500/80 to-red-700/90",
    },
    {
      href: "/lounges",
      label: "Lounges",
      description: "Manage lounge facilities",
      gradient: "from-yellow-500/80 to-yellow-700/90",
    },
    {
      href: "/lounge-bookings",
      label: "Lounge Bookings",
      description: "View and manage lounge bookings",
      gradient: "from-teal-500/80 to-teal-700/90",
    },
    {
      href: "/order-feedback",
      label: "Feedback",
      description: "View customer feedback",
      gradient: "from-indigo-500/80 to-indigo-700/90",
    },
    {
      href: "/instruction",
      label: "Instructions",
      description: "Manage Homepage instructions",
      gradient: "from-orange-500/80 to-orange-700/90",
    },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl px-6 py-2 shadow-lg">
          <h1 className="text-base text-center font-bold text-white">
            OI Secretary Dashboard
          </h1>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={item.disabled ? "pointer-events-none" : ""}>
                <div className="group relative h-64 sm:h-80 bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300">
                  <div className={`absolute inset-0 bg-gradient-to-b ${item.gradient} transform transition-transform duration-300 group-hover:scale-105 group-active:scale-105`}>
                    <div
                      className="absolute inset-0 opacity-10 mix-blend-overlay bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: "url('/cmelogo.png')" }}
                    ></div>
                  </div>
                  <div className="relative h-full p-6 sm:p-8 flex flex-col justify-between">
                    <div className="rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm"></div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white tracking-tight">
                        {item.label}
                      </h2>
                      <p className="text-white/90 text-base sm:text-lg mb-4 leading-relaxed">
                        {item.description}
                      </p>
                      {!item.disabled && (
                        <span className="inline-flex items-center text-white text-sm sm:text-base font-medium group-hover:underline group-active:underline">
                          {item.label === "Events" ? "View Events" : `Manage ${item.label}`}
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 ml-2 transform group-hover:translate-x-1 group-active:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
