"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Image from 'next/image';

interface Registration {
  _id: string;
  eventId: string;
  username: string;
  registrationCode: string;
  numberOfGuests: number;
  eventPrice: number;
  guestPrice: number;
  totalPrice: number;
  status: string;
  event?: {
    name: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    imageUrl?: string;
  };
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export default function RegisteredEventsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showQR, setShowQR] = useState<string | null>(null);
  const qrRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const username = Cookies.get("username");
        const token = Cookies.get("token");

        if (!username || !token) {
          router.push("/signin");
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/events/user/${username}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch registrations");
        }

        const data = await response.json();
        setRegistrations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [router]);

  const toggleQR = (registrationId: string) => {
    setShowQR(showQR === registrationId ? null : registrationId);
  };

  const downloadTicketAsPDF = async (registrationId: string) => {
    const qrElement = qrRefs.current[registrationId];
    if (!qrElement) return;

    try {
      // Create canvas with higher resolution and proper settings
      const canvas = await html2canvas(qrElement, {
        scale: 3, // Triple resolution for better quality
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: qrElement.scrollWidth,
        windowHeight: qrElement.scrollHeight,
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF with proper orientation
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "landscape",
        unit: "mm",
        format: [imgWidth, imgHeight],
      });

      // Add image to PDF
      pdf.addImage(
        canvas.toDataURL("image/png", 1.0),
        "PNG",
        0,
        0,
        imgWidth,
        imgHeight
      );

      // Save PDF
      pdf.save(`ticket-${registrationId}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF ticket");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen p-4">
        <div className="text-center">
          <p>Loading your registrations...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl px-6 py-2 mb-4 shadow-lg">
          <h1 className="text-base text-center font-bold text-white">
            My Events
          </h1>
        </div>

        {error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6">
            {error}
          </div>
        ) : registrations.length === 0 ? (
          <div className="bg-blue-100 text-blue-800 p-4 rounded-md mb-6">
            {"You haven't registered for any events yet."}
          </div>
        ) : (
          <div className="space-y-6">
            {registrations.map((reg) => (
              <div
                key={reg._id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {reg.event?.imageUrl && (
                  <div className="h-48 bg-gray-200">
                    <Image
                      src={reg.event.imageUrl}
                      alt={reg.event.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800">
                      {reg.event?.name || "Event"}
                    </h2>
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        reg.status === "approved"
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                      }`}
                    >
                      {reg.status === "approved" ? "Approved" : "Pending"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Date:</span>{" "}
                        {reg.event?.date
                          ? new Date(reg.event.date).toLocaleDateString()
                          : "N/A"}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Time:</span>{" "}
                        {reg.event?.startTime || "N/A"} -{" "}
                        {reg.event?.endTime || "N/A"}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Location:</span>{" "}
                        {reg.event?.location || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Guests:</span>{" "}
                        {reg.numberOfGuests}
                      </p>
                      {reg.totalPrice > 0 && (
                        <p className="text-gray-600">
                          <span className="font-medium">Total Price:</span> ₹
                          {reg.totalPrice}
                        </p>
                      )}
                    </div>
                  </div>

                  {reg.status === "approved" && (
                    <div className="mt-4 space-y-4">
                      <div className="flex gap-4">
                        <button
                          onClick={() => toggleQR(reg._id)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                          {showQR === reg._id ? "Hide Ticket" : "Show Ticket"}
                        </button>
                        {showQR === reg._id && (
                          <button
                            onClick={() => downloadTicketAsPDF(reg._id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Download Ticket
                          </button>
                        )}
                      </div>

                      {showQR === reg._id && (
                        <div
                          ref={(el) => {
                            if (el) {
                              qrRefs.current[reg._id] = el;
                            }
                          }}
                          className="mt-4 p-6 border rounded-lg bg-white"
                          style={{
                            width: "100%",
                            maxWidth: "800px",
                            boxSizing: "border-box",
                          }}
                        >
                          <h3 className="text-xl font-bold mb-4 text-center">
                            Your Event Ticket
                          </h3>
                          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex-1">
                              <div className="p-4 bg-white border-2 border-gray-200 rounded-lg flex justify-center">
                                <QRCodeSVG
                                  value={`${reg.username}|${reg.registrationCode}|${reg.eventId}`}
                                  size={180}
                                  level="H"
                                  includeMargin={true}
                                />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="space-y-3 text-gray-700">
                                <p className="text-lg">
                                  <span className="font-semibold">Event:</span>{" "}
                                  {reg.event?.name}
                                </p>
                                <p>
                                  <span className="font-semibold">Date:</span>{" "}
                                  {reg.event?.date
                                    ? new Date(
                                        reg.event.date
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </p>
                                <p>
                                  <span className="font-semibold">Time:</span>{" "}
                                  {reg.event?.startTime} - {reg.event?.endTime}
                                </p>
                                <p>
                                  <span className="font-semibold">Location:</span>{" "}
                                  {reg.event?.location}
                                </p>
                                <p className="pt-4 text-sm text-gray-500 italic">
                                  Present this QR code at the event entrance for
                                  check-in
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {reg.status === "pending" && reg.totalPrice > 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <p className="text-yellow-700">
                        Your registration is pending approval. Please complete
                        the payment to confirm your spot.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}