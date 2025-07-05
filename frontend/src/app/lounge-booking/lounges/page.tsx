"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from 'next/image';
interface Lounge {
  _id: string;
  name: string;
  description: string;
  photos: string[];
  capacity: number;
  cost: number;
  barCounters: number;
  waiters: number;
}

export default function LoungesList() {
  const [lounges, setLounges] = useState<Lounge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLounges = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lounges`);
        if (!response.ok) throw new Error("Failed to fetch lounges");
        const data = await response.json();
        setLounges(data);
      } catch (err) {
        // Properly type the error
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLounges();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading Lounges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="bg-red-100 text-red-800 p-6 rounded-lg shadow-md border border-red-300 text-center max-w-md w-full">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Error</h2>
          <p className="text-sm sm:text-base">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-4 sm:py-6 px-4 sm:px-6 ">
      <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl px-6 py-2 mb-4 shadow-lg">
            <h1 className="text-base text-center font-bold text-white ">Available Lounges</h1>
          </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lounges.map((lounge) => (
            <div
              key={lounge._id}
              className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              <div className="h-48 sm:h-56 bg-gray-100 overflow-hidden">
                {lounge.photos?.length > 0 ? (
                  <Image
                    src={lounge.photos[0]}
                    alt={`Image of ${lounge.name}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm sm:text-base">
                    No Image Available
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{lounge.name}</h2>
                <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-2">{lounge.description}</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Capacity</p>
                    <p className="font-medium text-sm sm:text-base">{lounge.capacity} guests</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Base Cost</p>
                    <p className="font-medium text-sm sm:text-base">₹{lounge.cost.toLocaleString()}</p>
                  </div>
                </div>
                <Link
                  href={`/lounge-booking/lounges/${lounge._id}`}
                  className="block w-full bg-indigo-600 text-white text-center py-2 sm:py-3 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-all duration-300 font-medium text-sm sm:text-base"
                  aria-label={`Book ${lounge.name} lounge`}
                >
                  Book Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}