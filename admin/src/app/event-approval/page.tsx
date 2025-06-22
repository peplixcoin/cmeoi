"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Check, Loader2, ClipboardCheck, Clock, Menu } from "lucide-react";
import { toast } from "react-hot-toast";

interface Registration {
  _id: string;
  eventId: string; // Matches Event.eventId
  username: string;
  registrationCode: string;
  numberOfGuests: number;
  eventPrice: number;
  guestPrice: number;
  totalPrice: number;
  status: string;
  qrGenerated: boolean;
  transaction_id?: string;
  createdAt: string;
  event?: {
    _id: string;
    eventId: string;
    name: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    imageUrl?: string;
    isPaid: boolean;
  };
}

interface Event {
  _id: string; // Used for selection in UI
  eventId: string; // Used for filtering registrations
  name: string;
}

type TabType = "pending" | "approved";

export default function AdminEventRegistrationsPage() {
  const [registrations, setRegistrations] = useState<{
    pending: Registration[];
    approved: Registration[];
  }>({ pending: [], approved: [] });
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null); // Changed: Initialized to null
  const [loading, setLoading] = useState({
    events: true,
    registrations: true,
  });
  const [error, setError] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("pending");
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

    fetchEvents();
  }, [router]);

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
      if (window.innerWidth < 768) {
        setScrolled(window.scrollY > 50);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading((prev) => ({ ...prev, events: true }));
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("adminToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch events");
      const data: Event[] = await response.json();
      setEvents(data);
      if (data.length > 0) {
        setSelectedEvent(data[0]._id); // Select the first event by default
      } else {
        setSelectedEvent(null); // No event selected if no events
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load events");
      setEvents([]);
      setSelectedEvent(null);
    } finally {
      setLoading((prev) => ({ ...prev, events: false }));
    }
  };

  const fetchRegistrations = async () => {
    if (!selectedEvent) {
      // If no event is selected (e.g., no events exist)
      setRegistrations({ pending: [], approved: [] });
      setLoading((prev) => ({ ...prev, registrations: false }));
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, registrations: true }));
      setError("");

      const [pendingRes, approvedRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/events/pending-registrations`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("adminToken")}`,
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/events/approved-registrations`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("adminToken")}`,
          },
        }),
      ]);

      if (!pendingRes.ok)
        throw new Error("Failed to fetch pending registrations");
      if (!approvedRes.ok)
        throw new Error("Failed to fetch approved registrations");

      let pendingData = await pendingRes.json();
      let approvedData = await approvedRes.json();

      // Filter by selected event (selectedEvent is an _id)
      const eventToFilter = events.find((e) => e._id === selectedEvent);
      if (eventToFilter) {
        pendingData = pendingData.filter(
          (reg: Registration) => reg.eventId === eventToFilter.eventId
        );
        approvedData = approvedData.filter(
          (reg: Registration) => reg.eventId === eventToFilter.eventId
        );
      } else {
        // Should not happen if selectedEvent is always valid or null
        console.warn(
          "Selected event ID not found for filtering registrations."
        );
        pendingData = [];
        approvedData = [];
      }

      setRegistrations({
        pending: pendingData,
        approved: approvedData,
      });
    } catch (err) {
      console.error("Error fetching registrations:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setRegistrations({ pending: [], approved: [] }); // Clear on error
    } finally {
      setLoading((prev) => ({ ...prev, registrations: false }));
    }
  };

  useEffect(() => {
    if (!loading.events) {
      if (selectedEvent) {
        // Fetch registrations only if an event is selected
        fetchRegistrations();
      } else if (events.length === 0) {
        // No events, so clear registrations
        setRegistrations({ pending: [], approved: [] });
        setLoading((prev) => ({ ...prev, registrations: false }));
      }
    }
  }, [selectedEvent, activeTab, loading.events, events.length]); // Added events.length

  const approveRegistration = async (registrationId: string) => {
    try {
      setApprovingId(registrationId);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/events/registrations/${registrationId}/approve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${Cookies.get("adminToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve registration");
      }

      toast.success("Registration approved!");
      if (selectedEvent) {
        // Re-fetch registrations for the current event
        fetchRegistrations();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setApprovingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const currentRegistrations = registrations[activeTab];
  const selectedEventDetails = events.find((e) => e._id === selectedEvent);

  return (
    <div className="flex min-h-screen pt-4">
      {/* Hamburger Menu for Mobile */}
      {!isSidebarOpen && (
        <button
          className={`fixed z-40 p-3 bg-gray-600 text-white rounded-full shadow-lg transition-all duration-300 md:hidden ${
            scrolled ? "bottom-5 left-5" : "top-[6.7rem] left-3"
          }`}
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Sidebar: Event Filter */}
      <div
        ref={sidebarRef}
        className={`fixed pt-14 inset-y-0 left-0 w-64 bg-white shadow-lg transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-64 z-40 overflow-y-auto max-h-screen`}
      >
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Events</h2>
          {loading.events ? (
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : events.length > 0 ? (
            <ul className="space-y-2">
              {/* Removed "All Events" button */}
              {events.map((event) => (
                <li key={event._id}>
                  <button
                    className={`w-full text-left px-4 py-2 rounded-md ${
                      selectedEvent === event._id
                        ? "bg-gray-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => {
                      setSelectedEvent(event._id);
                      setIsSidebarOpen(false); // Close sidebar on selection (mobile)
                    }}
                  >
                    {event.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No events available</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:ml-10">
        {" "}
        {/* Note: md:ml-10 might need review based on your layout goals */}
        <h1 className="text-2xl font-semibold mb-6 pl-12">
          Event Registrations
        </h1>
        {/* Current Event Filter (Mobile) - Show if an event is selected */}
        {selectedEventDetails && (
          <div className="md:hidden mb-4 bg-gray-100 p-3 rounded-lg">
            <p className="font-medium">Showing registrations for:</p>
            <p className="font-semibold">{selectedEventDetails.name}</p>
          </div>
        )}
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("pending")}
            disabled={!selectedEvent && events.length > 0} // Disable if events exist but none selected (edge case)
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              activeTab === "pending"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            } ${
              !selectedEvent && events.length > 0
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
          >
            <Clock className="h-4 w-4" />
            Pending
            <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full ml-1">
              {registrations.pending.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            disabled={!selectedEvent && events.length > 0} // Disable if events exist but none selected
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              activeTab === "approved"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500 hover:text-gray-700"
            } ${
              !selectedEvent && events.length > 0
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            Approved
            <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full ml-1">
              {registrations.approved.length}
            </span>
          </button>
        </div>
        {/* Loading State */}
        {loading.registrations && (
          <div className="flex justify-center my-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        {/* Error State */}
        {error && !loading.registrations && (
          <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        {/* Registrations Grid / Empty State Message */}
        {!loading.registrations &&
        !error &&
        currentRegistrations.length === 0 ? (
          <div className="bg-blue-100 text-blue-800 p-4 rounded-md">
            {(() => {
              if (events.length === 0) {
                return "No events available to display registrations.";
              }
              if (selectedEventDetails) {
                return `No ${activeTab} registrations found for "${selectedEventDetails.name}".`;
              }
              // This case should ideally not be reached if an event is auto-selected
              // or if there are no events.
              return `No ${activeTab} registrations found. Please select an event if available.`;
            })()}
          </div>
        ) : (
          !loading.registrations &&
          !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentRegistrations.map((reg) => (
                <div
                  key={reg._id}
                  className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow relative"
                >
                  {/* Event Image */}
                  {reg.event?.imageUrl && (
                    <div className="relative mb-4">
                      <img
                        src={reg.event.imageUrl}
                        alt={reg.event.name}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Event Details */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h2 className="text-lg font-semibold">
                        {reg.event?.name || "Event"}
                      </h2>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          reg.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {reg.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600">
                      <span className="font-medium">User:</span> {reg.username}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Guests:</span>{" "}
                      {reg.numberOfGuests}
                    </p>

                    {reg.event?.isPaid && (
                      <>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Total:</span> ₹
                          {reg.totalPrice}
                        </p>
                        {reg.transaction_id && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Transaction ID:</span>{" "}
                            {reg.transaction_id}
                          </p>
                        )}
                      </>
                    )}
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Registered On:</span>{" "}
                      {new Date(reg.createdAt).toLocaleString()}
                    </p>

                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Date:</span>{" "}
                        {reg.event?.date
                          ? new Date(reg.event.date).toLocaleDateString()
                          : "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Time:</span>{" "}
                        {reg.event?.startTime || "N/A"} -{" "}
                        {reg.event?.endTime || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Location:</span>{" "}
                        {reg.event?.location || "N/A"}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    {activeTab === "pending" ? (
                      <div className="flex justify-center pt-4">
                        <button
                          onClick={() => approveRegistration(reg._id)}
                          disabled={approvingId === reg._id}
                          className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                            approvingId === reg._id
                              ? "bg-purple-300 text-white cursor-not-allowed"
                              : "bg-purple-600 hover:bg-purple-700 text-white"
                          }`}
                        >
                          {approvingId === reg._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Approve
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {reg.registrationCode}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(reg.registrationCode)
                            }
                            className="text-gray-500 hover:text-gray-700"
                            title="Copy code"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                                ry="2"
                              ></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            reg.qrGenerated
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {reg.qrGenerated ? "QR Generated" : "QR Pending"}
                        </span>
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
  );
}
