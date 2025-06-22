"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Check, X, Clock, ClipboardCheck, Loader2, Menu } from "lucide-react"; // Added Menu
import { toast } from "react-hot-toast";

interface Booking {
  _id: string;
  username: string;
  loungeId: string; // Ensure this matches the ID of the lounge
  lounge: { // This is populated from the backend
    name: string;
    photos: string[];
  };
  bookingDate: string;
  guestsCount: number;
  bookingStatus: string;
  catering: string;
  occasion: string;
  bookingTotal: number;
  totalCost: number;
  transactionId: string;
  createdAt: string;
}

// Interface for Lounge data fetched for the sidebar
interface Lounge {
  _id: string;
  name: string;
  // Add other properties if needed for display or logic
}

type TabType = "pending" | "approved" | "rejected";

export default function AdminLoungeBookingsPage() {
  const [bookings, setBookings] = useState<{
    pending: Booking[];
    approved: Booking[];
    rejected: Booking[];
  }>({ pending: [], approved: [], rejected: [] });

  const [lounges, setLounges] = useState<Lounge[]>([]);
  const [selectedLounge, setSelectedLounge] = useState<string | null>("all"); // "all", lounge_id, or null
  const [loadingLounges, setLoadingLounges] = useState(true);

  const [loading, setLoading] = useState(true); // For bookings
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("adminToken");
    const role = Cookies.get("adminRole");

    if (!token || role !== "SuperAdmin") {
      router.push("/login");
      return;
    }
    fetchLounges(); // Fetch lounges on initial load
  }, [router]);

  useEffect(() => {
    // Fetch bookings whenever the selected lounge, active tab changes,
    // or after lounges have finished loading (to ensure initial fetch works)
    if (!loadingLounges) {
      fetchBookings();
    }
  }, [selectedLounge, activeTab, loadingLounges]); // Added loadingLounges

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 768) { // md breakpoint
        setScrolled(window.scrollY > 50);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchLounges = async () => {
    try {
      setLoadingLounges(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lounges`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("adminToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch lounges");
      const data: Lounge[] = await response.json();
      setLounges(data);
      // setSelectedLounge("all"); // Default to "all"
    } catch (error) {
      console.error("Error fetching lounges:", error);
      toast.error("Failed to load lounges");
      setLounges([]);
      setSelectedLounge(null); // No selection if lounges fail to load
    } finally {
      setLoadingLounges(false);
    }
  };

  const fetchBookings = async () => {
    if (!selectedLounge && lounges.length > 0 && selectedLounge !== "all") {
       // If lounges exist, "all" is not selected, and no specific lounge is selected,
       // this can be a state to show "Please select a lounge" or fetch nothing.
       // For now, we clear bookings and stop loading if no specific lounge is selected and "all" is not active.
      if (selectedLounge !== "all") {
        setBookings({ pending: [], approved: [], rejected: [] });
        setLoading(false);
        return;
      }
    }


    try {
      setLoading(true);
      setError("");

      const commonHeaders = {
        Authorization: `Bearer ${Cookies.get("adminToken")}`,
      };

      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lounges/admin/lounge-bookings/pending`, { headers: commonHeaders }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lounges/admin/lounge-bookings/approved`, { headers: commonHeaders }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lounges/admin/lounge-bookings/rejected`, { headers: commonHeaders }),
      ]);

      if (!pendingRes.ok) throw new Error(`Failed to fetch pending bookings: ${pendingRes.statusText}`);
      if (!approvedRes.ok) throw new Error(`Failed to fetch approved bookings: ${approvedRes.statusText}`);
      if (!rejectedRes.ok) throw new Error(`Failed to fetch rejected bookings: ${rejectedRes.statusText}`);

      let pendingData = await pendingRes.json();
      let approvedData = await approvedRes.json();
      let rejectedData = await rejectedRes.json();

      if (selectedLounge && selectedLounge !== "all") {
        const filterByLounge = (booking: Booking) => booking.loungeId === selectedLounge;
        pendingData = pendingData.filter(filterByLounge);
        approvedData = approvedData.filter(filterByLounge);
        rejectedData = rejectedData.filter(filterByLounge);
      }

      setBookings({
        pending: pendingData,
        approved: approvedData,
        rejected: rejectedData,
      });
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err instanceof Error ? err.message : "An error occurred while fetching bookings");
      setBookings({ pending: [], approved: [], rejected: [] });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: "approved" | "rejected" | "pending") => {
    try {
      setUpdatingId(bookingId);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/lounges/admin/lounge-bookings/${bookingId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("adminToken")}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update booking status");
      }

      toast.success(`Booking ${status} successfully!`);
      fetchBookings(); // Re-fetch to update lists
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred during status update");
    } finally {
      setUpdatingId(null);
    }
  };

  const currentBookings = bookings[activeTab];
  const selectedLoungeDetails = selectedLounge === "all"
    ? { _id: "all", name: "All Lounges" }
    : lounges.find((l) => l._id === selectedLounge);

  return (
    <div className="flex min-h-screen pt-4 ">
      {!isSidebarOpen && (
        <button
          className={`fixed z-50 p-3 bg-gray-700 hover:bg-gray-800 text-white rounded-full shadow-lg transition-all duration-300 md:hidden ${
            scrolled ? "bottom-5 left-5" : "top-[calc(env(safe-area-inset-top,0px)+4.5rem)] left-3" // Adjusted for potential navbar
          }`}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div
        ref={sidebarRef}
        className={`fixed pt-16 inset-y-0 left-0 w-64 bg-white shadow-xl transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:translate-x-0 md:static z-40 overflow-y-auto h-screen md:h-auto md:max-h-screen md:min-h-screen scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100`}
      >
        <div className="p-5">
          <h2 className="text-xl font-bold text-gray-800 mb-5">Lounges</h2>
          {loadingLounges ? (
            <div className="flex justify-center items-center h-20">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : (
            <ul className="space-y-2">
              <li>
                <button
                  className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors duration-150 ${
                    selectedLounge === "all"
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700"
                  }`}
                  onClick={() => {
                    setSelectedLounge("all");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                >
                  All Lounges
                </button>
              </li>
              {lounges.map((lounge) => (
                <li key={lounge._id}>
                  <button
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors duration-150 ${
                      selectedLounge === lounge._id
                        ? "bg-purple-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700"
                    }`}
                    onClick={() => {
                      setSelectedLounge(lounge._id);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                  >
                    {lounge.name}
                  </button>
                </li>
              ))}
              {lounges.length === 0 && !loadingLounges && (
                 <p className="text-sm text-gray-500 px-4 py-2">No lounges found.</p>
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-full mx-auto">
            <h1 className="text-xl font-bold text-gray-800 mb-2">
            Lounge Bookings
            </h1>
           


          <div className="flex border-b border-gray-300 mb-6">
            {(["pending", "approved", "rejected"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                disabled={(!selectedLounge && lounges.length > 0 && selectedLounge !== "all") && tab !== activeTab} // More precise disabling
                className={`px-3 py-3 md:px-6 md:py-3 font-semibold flex items-center gap-2 text-sm md:text-base transition-colors duration-150 -mb-px ${
                  activeTab === tab
                    ? tab === "pending" ? "text-blue-600 border-b-2 border-blue-600"
                    : tab === "approved" ? "text-green-600 border-b-2 border-green-600"
                    : "text-red-600 border-b-2 border-red-600"
                    : "text-gray-500 hover:text-gray-800 border-b-2 border-transparent"
                } ${((!selectedLounge && lounges.length > 0 && selectedLounge !== "all") && tab !== activeTab) ? "cursor-not-allowed opacity-60" : ""}`}
              >
                {tab === "pending" && <Clock className="h-4 w-4 md:h-5 md:w-5" />}
                {tab === "approved" && <ClipboardCheck className="h-4 w-4 md:h-5 md:w-5" />}
                {tab === "rejected" && <X className="h-4 w-4 md:h-5 md:w-5" />}
                <span className="capitalize">{tab}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-1 ${
                  activeTab === tab
                  ? tab === "pending" ? "bg-blue-100 text-blue-700"
                  : tab === "approved" ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
                  : "bg-gray-200 text-gray-700"
                }`}>
                  {bookings[tab].length}
                </span>
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center items-center my-12">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg mb-6 shadow">
              <h3 className="font-semibold mb-1">Error Loading Bookings</h3>
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchBookings}
                className="mt-3 px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && currentBookings.length === 0 ? (
            <div className="bg-blue-50 text-blue-700 border border-blue-200 p-6 rounded-lg text-center shadow">
                <ClipboardCheck className="h-12 w-12 mx-auto text-blue-400 mb-3" />
                <h3 className="text-xl font-semibold mb-1">No Bookings Found</h3>
              {(() => {
                if (lounges.length === 0 && !loadingLounges) {
                  return <p className="text-sm">There are no lounges available to display bookings.</p>;
                }
                if (selectedLoungeDetails) {
                  const loungeName = selectedLounge === "all" ? "any lounge" : `"${selectedLoungeDetails.name}"`;
                  return <p className="text-sm">There are currently no {activeTab} bookings for {loungeName}.</p>;
                }
                return <p className="text-sm">Please select a lounge from the sidebar to view {activeTab} bookings.</p>;
              })()}
            </div>
          ) : (
            !loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {currentBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="bg-white p-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out relative overflow-hidden border border-gray-200"
                  >
                    <div className="relative mb-4 h-48 rounded-lg overflow-hidden">
                      {booking.lounge?.photos?.length > 0 ? (
                        <img
                          src={booking.lounge.photos[0]}
                          alt={booking.lounge.name || "Lounge image"}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                          No Image
                        </div>
                      )}
                       <span
                        className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-xs font-bold shadow ${
                          booking.bookingStatus === "approved"
                            ? "bg-green-500 text-white"
                            : booking.bookingStatus === "rejected"
                            ? "bg-red-500 text-white"
                            : "bg-yellow-400 text-gray-800"
                        }`}
                      >
                        {booking.bookingStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-2.5 text-sm">
                      <h2 className="text-xl font-bold text-gray-800 truncate" title={booking.lounge?.name || "Lounge Name"}>
                        {booking.lounge?.name || "Lounge Name"}
                      </h2>
                      <p className="text-gray-600"><span className="font-semibold text-gray-700">User:</span> {booking.username}</p>
                      <p className="text-gray-600"><span className="font-semibold text-gray-700">Date:</span> {new Date(booking.bookingDate).toLocaleDateString()}</p>
                      <p className="text-gray-600"><span className="font-semibold text-gray-700">Guests:</span> {booking.guestsCount}</p>
                      <p className="text-gray-600"><span className="font-semibold text-gray-700">Occasion:</span> {booking.occasion}</p>
                      <p className="text-gray-600"><span className="font-semibold text-gray-700">Catering:</span> {booking.catering}</p>
                      <p className="text-gray-600"><span className="font-semibold text-gray-700">Amount Paid:</span> ₹{booking.bookingTotal?.toLocaleString()}</p>
                      <p className="text-gray-600"><span className="font-semibold text-gray-700">Total Est. Cost:</span> ₹{booking.totalCost?.toLocaleString()}</p>
                      <p className="text-gray-600 truncate" title={booking.transactionId}><span className="font-semibold text-gray-700">Transaction ID:</span> {booking.transactionId || "N/A"}</p>
                      <p className="text-xs text-gray-500 pt-2 border-t border-gray-100 mt-2"><span className="font-semibold">Booked:</span> {new Date(booking.createdAt).toLocaleString()}</p>

                      {activeTab === "pending" && (
                        <div className="flex justify-between items-center pt-4 gap-3">
                          <button
                            onClick={() => updateBookingStatus(booking._id, "approved")}
                            disabled={updatingId === booking._id}
                            className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-150 ${
                              updatingId === booking._id
                                ? "bg-green-300 text-white cursor-not-allowed"
                                : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                          >
                            {updatingId === booking._id ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<Check className="h-4 w-4" />)}
                            Approve
                          </button>
                          <button
                            onClick={() => updateBookingStatus(booking._id, "rejected")}
                            disabled={updatingId === booking._id}
                            className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-150 ${
                              updatingId === booking._id
                                ? "bg-red-300 text-white cursor-not-allowed"
                                : "bg-red-500 hover:bg-red-600 text-white"
                            }`}
                          >
                            {updatingId === booking._id ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<X className="h-4 w-4" />)}
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}