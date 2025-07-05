"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, ArrowRight, AlertCircle } from "lucide-react";
import Image from 'next/image';
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

export default function EventPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/events`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const data: Event[] = await response.json();
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate availability percentage
  const calculateAvailability = (event: Event) => {
    const registered = event.registeredUsers?.length || 0;
    const percentage = Math.max(
      0,
      Math.min(100, ((event.capacity - registered) / event.capacity) * 100)
    );
    return percentage;
  };

  // Get availability color class
  const getAvailabilityColorClass = (percentage: number) => {
    if (percentage > 50) return "bg-green-500";
    if (percentage > 20) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen py-4">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        {/* Featured Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl px-8 py-2 text-white shadow-lg mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-3">Community Events</h2>
              <p className="text-indigo-100 max-w-xl">
                From workshops to social gatherings, we have something for
                everyone. Browse our upcoming events and secure your spot today.
              </p>
            </div>
            <div className="mt-6 md:mt-0">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 inline-flex items-center">
                <Calendar className="mr-2" />
                <span className="font-semibold">
                  {events.length} Upcoming Events
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center justify-center mb-6">
            <AlertCircle className="text-red-500 mr-3" size={24} />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {events.length === 0 && !loading && !error && (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center max-w-2xl mx-auto">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Calendar size={36} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Events Scheduled
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              There are no upcoming events at the moment. Please check back later
              for new announcements.
            </p>
            <Link href="/">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg transition-colors">
                Back to Home
              </button>
            </Link>
          </div>
        )}

        {/* Events Grid */}
        {events.length > 0 && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => {
              const availabilityPercentage = calculateAvailability(event);
              const availabilityColorClass =
                getAvailabilityColorClass(availabilityPercentage);
              const spotsRemaining =
                event.capacity - (event.registeredUsers?.length || 0);

              return (
                <div
                  key={event.eventId}
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300"
                >
                  {/* Event Image */}
                  <div className="relative h-48 overflow-hidden">
                    {event.imageUrl ? (
                      <Image
                        src={event.imageUrl}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-lg font-medium">
                          {event.name}
                        </span>
                      </div>
                    )}

                    {/* Price Badge */}
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          event.isPaid
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-green-100 text-green-800 border border-green-200"
                        }`}
                      >
                        {event.isPaid ? `₹${event.price}` : "Free"}
                      </span>
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-3">
                      {event.name}
                    </h2>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar
                          size={16}
                          className="mr-2 text-indigo-500"
                        />
                        <span>{formatDate(event.date)}</span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <Clock size={16} className="mr-2 text-indigo-500" />
                        <span>
                          {event.startTime} - {event.endTime}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <MapPin size={16} className="mr-2 text-indigo-500" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-5 line-clamp-2">
                      {event.description}
                    </p>

                    {/* Availability Indicator */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Spots Remaining: {spotsRemaining}</span>
                        <span>{availabilityPercentage.toFixed(0)}% Available</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${availabilityColorClass}`}
                          style={{ width: `${availabilityPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link href={`/events/${event.eventId}`}>
                      <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                        <span>View Details</span>
                        <ArrowRight size={16} className="ml-2" />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}