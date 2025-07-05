"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Instruction {
  _id: string;
  instruction: string;
  createdAt: string;
}

export default function Home() {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);

  // Fetch instructions from backend
  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/instructions`);
        if (!response.ok) throw new Error("Failed to fetch instructions");
        const data = await response.json();
        setInstructions(data);
      } catch (error) {
        console.error("Error fetching instructions:", error);
      }
    };
    fetchInstructions();
  }, []);

  // Cycle through instructions every 7 seconds
  useEffect(() => {
    if (instructions.length > 0) {
      const interval = setInterval(() => {
        setCurrentInstructionIndex(
          (prevIndex) => (prevIndex + 1) % instructions.length
        );
      }, 7000); // Change every 7 seconds
      return () => clearInterval(interval);
    }
  }, [instructions]);

  return (
    <main className="min-h-screen p-4 sm:p-6 pt-20 sm:pt-24">
   {instructions.length > 0 && (
  <div className="fixed top-16 left-0 right-0 z-50 max-w-5xl mx-auto mt-4 lg:mt-8 px-2">
    <div className="bg-yellow-100/80 rounded-lg py-3 px-1 text-center text-gray-800 font-medium text-sm sm:text-lg shadow-md animate-blink backdrop-blur-sm">
      <div className="flex items-center justify-center gap-1">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 text-yellow-600" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"
            clipRule="evenodd"
          />
        </svg>
        <div>{instructions[currentInstructionIndex].instruction}</div>
      </div>
      <style jsx>{`
        @keyframes blink {
          0% {
            box-shadow: 0 0 6px rgba(204, 109, 0, 0.9),
              0 0 12px rgba(204, 44, 0, 0.7);
          }
          50% {
            box-shadow: 0 0 12px rgb(204, 41, 0),
              0 0 20px rgba(204, 44, 0, 0.9);
          }
          100% {
            box-shadow: 0 0 6px rgba(204, 92, 0, 0.9),
              0 0 12px rgba(204, 116, 0, 0.7);
          }
        }
        .animate-blink {
          animation: blink 1.5s infinite;
        }
        .backdrop-blur-sm {
          backdrop-filter: blur(4px);
        }
        @media (min-width: 640px) {
          .animate-blink {
            animation: blink 1.5s infinite;
          }
        }
      `}</style>
    </div>
  </div>
)}

      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12 mt-1">
        {/* Dine-In Card */}
        <Link href="/dine/menu">
          <div className="group relative h-64 sm:h-80 bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/80 to-blue-700/90 transform transition-transform duration-300 group-hover:scale-105 group-active:scale-105">
              <div
                className="absolute inset-0 opacity-10 mix-blend-overlay bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/cmelogo.png')" }}
              ></div>
            </div>
            <div className="relative h-full p-6 sm:p-8 flex flex-col justify-between">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white tracking-tight">
                  Dine-In
                </h2>
                <p className="text-white/90 text-base sm:text-lg mb-4 leading-relaxed">
                  Experience our delicious meals in-house
                </p>
                <span className="inline-flex items-center text-white text-sm sm:text-base font-medium group-hover:underline group-active:underline">
                  Reserve a Table
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
              </div>
            </div>
          </div>
        </Link>

        {/* Order Online Card */}
        <Link href="/online/menu">
          <div className="group relative h-64 sm:h-80 bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-green-500/80 to-green-700/90 transform transition-transform duration-300 group-hover:scale-105 group-active:scale-105">
              <div
                className="absolute inset-0 opacity-10 mix-blend-overlay bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/cmelogo.png')" }}
              ></div>
            </div>
            <div className="relative h-full p-6 sm:p-8 flex flex-col justify-between">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white tracking-tight">
                  Order Online
                </h2>
                <p className="text-white/90 text-base sm:text-lg mb-4 leading-relaxed">
                  Get your favorite dishes delivered to your doorstep
                </p>
                <span className="inline-flex items-center text-white text-sm sm:text-base font-medium group-hover:underline group-active:underline">
                  Start Ordering
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
              </div>
            </div>
          </div>
        </Link>

        {/* Events Card */}
        <Link href="/events/upcoming">
          <div className="group relative h-64 sm:h-80 bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/80 to-purple-700/90 transform transition-transform duration-300 group-hover:scale-105 group-active:scale-105">
              <div
                className="absolute inset-0 opacity-10 mix-blend-overlay bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/cmelogo.png')" }}
              ></div>
            </div>
            <div className="relative h-full p-6 sm:p-8 flex flex-col justify-between">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white tracking-tight">
                  Events
                </h2>
                <p className="text-white/90 text-base sm:text-lg mb-4 leading-relaxed">
                  Join our special events and culinary experiences
                </p>
                <span className="inline-flex items-center text-white text-sm sm:text-base font-medium group-hover:underline group-active:underline">
                  View Events
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
              </div>
            </div>
          </div>
        </Link>

        {/* Lounge Booking Card */}
        <Link href="/lounge-booking/lounges">
          <div className="group relative h-64 sm:h-80 bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/80 to-amber-700/90 transform transition-transform duration-300 group-hover:scale-105 group-active:scale-105">
              <div
                className="absolute inset-0 opacity-10 mix-blend-overlay bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/cmelogo.png')" }}
              ></div>
            </div>
            <div className="relative h-full p-6 sm:p-8 flex flex-col justify-between">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white tracking-tight">
                  Facility Booking
                </h2>
                <p className="text-white/90 text-base sm:text-lg mb-4 leading-relaxed">
                  Reserve our lounge for weddings and parties
                </p>
                <span className="inline-flex items-center text-white text-sm sm:text-base font-medium group-hover:underline group-active:underline">
                  Reserve Now
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
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Promotional Banner */}
      <div className="bg-gray-900 rounded-xl overflow-hidden mb-12 max-w-5xl mx-auto">
        <div className="px-6 py-8 sm:px-8 sm:py-12 flex flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Need Help?
            </h2>
            <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
              Click below to contact our support team.
            </p>
            <Link href="/help">
              <span className="bg-white text-gray-900 px-6 py-3 rounded-full font-medium text-sm sm:text-base hover:bg-gray-100 transition-all duration-200 inline-block">
                Contact Support
              </span>
            </Link>
          </div>
          <div className="w-full flex justify-center">
            {/* Placeholder for future image or illustration */}
          </div>
        </div>
      </div>
    </main>
  );
}