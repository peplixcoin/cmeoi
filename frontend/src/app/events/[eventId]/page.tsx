"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { QRCodeSVG } from "qrcode.react";
import Modal from "@/components/Modal";
// Base API URL
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

// Define Event interface
interface Event {
  eventId: string;
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  isPaid: boolean;
  price?: number;
  guest_price?: number;
  imageUrl?: string;
  registeredUsers?: string[];
}

export default function EventDetailPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guests, setGuests] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<{
    paymentRequired: boolean;
    totalPrice: number;
    upiId: string;
  } | null>(null);
  const { eventId } = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch event");
        }
        const data: Event = await response.json();
        setEvent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleRegister = async () => {
    setIsRegistering(true);
    setError("");
    setAlreadyRegistered(false);
    
    try {
      const token = Cookies.get("token");
      const username = Cookies.get("username");
      
      if (!token || !username) {
        router.push("/signin");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          username,
          numberOfGuests: guests 
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message === "You are already registered for this event") {
          setAlreadyRegistered(true);
          setTimeout(() => {
            router.push("/events/registered");
          }, 3000);
        } else {
          throw new Error(data.message || "Registration failed");
        }
        return;
      }

      // If payment is required, show payment modal
      if (data.paymentRequired) {
        setPaymentDetails(data);
        setShowPaymentModal(true);
        return;
      }

      setRegistrationSuccess(true);
      setTimeout(() => {
        router.push("/events/registered");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePaymentComplete = async () => {
    if (!transactionId) {
      setError("Please enter transaction ID");
      return;
    }

    setIsRegistering(true);
    setError("");

    try {
      const token = Cookies.get("token");
      const username = Cookies.get("username");
      
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          username,
          numberOfGuests: guests,
          transaction_id: transactionId
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Payment verification failed");
      }

      setRegistrationSuccess(true);
      setShowPaymentModal(false);
      setTimeout(() => {
        router.push("/events/registered");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment verification failed");
    } finally {
      setIsRegistering(false);
    }
  };

  const openUpiApp = () => {
    const upiUrl = `upi://pay?pa=${paymentDetails?.upiId}&pn=YourBusinessName&am=${paymentDetails?.totalPrice}&cu=INR`;
    window.open(upiUrl, "_blank");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Loading event...</p>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Error: {error || "Event not found"}</p>
        </div>
      </main>
    );
  }

  const availableSpots = event.capacity - (event.registeredUsers?.length || 0);
  const maxGuests = Math.max(0, availableSpots - 1);

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-bold mb-2 text-center text-gray-800">{event.name}</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="h-64 bg-purple-500 flex items-center justify-center">
            {event.imageUrl ? (
              <img 
                src={event.imageUrl} 
                alt={event.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-white text-lg">Event Image</span>
            )}
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">{event.name}</h2>
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  event.isPaid
                    ? "bg-purple-100 text-purple-800 border border-purple-300"
                    : "bg-gray-100 text-gray-800 border border-gray-300"
                }`}
              >
                {event.isPaid ? `₹${event.price} + ₹${event.guest_price}/guest` : "Free"}
              </span>
            </div>

            <div className="space-y-3 text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  {event.startTime} - {event.endTime}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{event.location}</span>
              </div>
            </div>

            <p className="text-gray-600 mb-6">{event.description}</p>
            <p className="text-sm text-gray-500 mb-6">
              Spots available: {availableSpots}
            </p>

            <div className="space-y-4">
              {event.isPaid && availableSpots > 0 && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="guests" className="text-gray-700 font-medium">
                    Number of Guests:
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      id="guests"
                      min="0"
                      max={maxGuests}
                      value={guests}
                      onChange={(e) => setGuests(Math.min(maxGuests, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-20 px-3 py-2 border rounded-md"
                    />
                    <span className="text-sm text-gray-500">
                      {event.guest_price ? `(₹${event.guest_price} per guest)` : ''}
                    </span>
                  </div>
                  {event.isPaid && guests > 0 && (
                    <p className="text-sm text-gray-600">
                      Total: ₹{event.price! + (guests * (event.guest_price || 0))}
                    </p>
                  )}
                </div>
              )}

              {registrationSuccess ? (
                <div className="p-4 bg-green-100 text-green-800 rounded-md">
                  Registration successful! Redirecting to your events...
                </div>
              ) : alreadyRegistered ? (
                <div className="p-4 bg-blue-100 text-blue-800 rounded-md">
                  You are already registered for this event! Redirecting to your registrations in 3 seconds...
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={isRegistering || loading || availableSpots <= 0}
                  className={`w-full px-4 py-2 rounded-md transition-colors ${
                    isRegistering
                      ? "bg-purple-400 cursor-not-allowed"
                      : availableSpots <= 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  {availableSpots <= 0
                    ? "Event Full"
                    : isRegistering
                    ? "Registering..."
                    : "Register Now"}
                </button>
              )}

              {error && !alreadyRegistered && (
                <div className="p-4 bg-red-100 text-red-800 rounded-md">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && paymentDetails && (
        <Modal onClose={() => setShowPaymentModal(false)}>
          <div className="p-6 max-w-md mx-auto bg-white rounded-lg">
            <h2 className="text-xl font-bold mb-4">Complete Payment</h2>
            <p className="mb-4">Total Amount: ₹{paymentDetails.totalPrice}</p>
            
            <div className="mb-6 p-4 border rounded-lg flex justify-center">
              <QRCodeSVG
                value={`upi://pay?pa=${paymentDetails.upiId}&pn=YourBusinessName&am=${paymentDetails.totalPrice}&cu=INR`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <p className="mb-4 text-center">Scan QR code or click Pay Now</p>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={openUpiApp}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Pay Now
              </button>
              
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter UPI transaction ID"
                />
              </div>
              
              <button
                onClick={handlePaymentComplete}
                disabled={!transactionId || isRegistering}
                className={`px-4 py-2 rounded-md ${
                  !transactionId || isRegistering 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {isRegistering ? "Verifying..." : "Complete Registration"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Contact us for event inquiries</p>
      </footer>
    </main>
  );
}