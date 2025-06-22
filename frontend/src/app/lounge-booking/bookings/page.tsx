"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";

interface Booking {
  _id: string;
  loungeId: string;
  lounge: {
    name: string;
    photos: string[];
  };
  bookingDate: string;
  guestsCount: number;
  bookingStatus: string;
  bookingTotal: number;
  totalCost: number;
  username: string;
  catering: string;
  additionalBarCounter: number;
  additionalWaiters: number;
  music: boolean;
  occasion: string;
  securityDeposit: number;
  ownArrangements: {
    generatorBackup: boolean;
    additionalFurniture: boolean;
    additionalLighting: boolean;
  };
  dignitaries: { rank: string; name: string; designation: string }[];
  transactionId: string;
  createdAt: string;
}

export default function UserBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMounted, setHasMounted] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setHasMounted(true);
    setUsername(Cookies.get("username") || null);
  }, []);

  useEffect(() => {
    if (!hasMounted || !username) return;

    const fetchBookings = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lounges/bookings/${username}`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch bookings");
        const data = await response.json();
        setBookings(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [username, hasMounted]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const handleDownloadBill = async (booking: Booking) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lounges/generate-bill`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(booking),
      });

      if (!response.ok) throw new Error("Failed to generate bill");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Booking_${booking._id}_Bill.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading bill:", err);
      alert("Failed to download bill. Please try again.");
    }
  };

  if (!hasMounted) {
    return <div className="min-h-screen pt-20 pb-10 px-4 text-center">Loading...</div>;
  }

  if (!username) {
    return (
      <div className="min-h-screen pt-20 pb-10 px-4 text-center">
        <p className="mb-4">Please sign in to view your bookings</p>
        <Link
          href="/signin"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen pt-20 pb-10 px-4 text-center">Loading...</div>;
  if (error) return <div className="min-h-screen pt-20 pb-10 px-4 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen pt-4 pb-10 px-4">
      <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl px-6 py-2 mb-4 shadow-lg">
            <h1 className="text-base text-center font-bold text-white ">My Bookings</h1>
          </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="mb-4">You don't have any lounge bookings yet.</p>
            <Link
              href="/lounge-booking/lounges"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Book a Lounge
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      {booking.lounge.photos?.length > 0 ? (
                        <img
                          src={booking.lounge.photos[0]}
                          alt={booking.lounge.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image Available
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6 md:w-2/3">
                    <div className="flex justify-between items-start">
                      <h2 className="text-xl font-bold">{booking.lounge.name}</h2>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          booking.bookingStatus
                        )}`}
                      >
                        {booking.bookingStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Booking Date</p>
                        <p className="font-medium">
                          {new Date(booking.bookingDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Guests</p>
                        <p className="font-medium">{booking.guestsCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Amount Paid</p>
                        <p className="font-medium">₹{booking.bookingTotal.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Cost</p>
                        <p className="font-medium">₹{booking.totalCost.toLocaleString()}</p>
                      </div>
                    </div>
                    {booking.bookingStatus === "approved" && (
                      <button
                        onClick={() => handleDownloadBill(booking)}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        Download Bill
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}