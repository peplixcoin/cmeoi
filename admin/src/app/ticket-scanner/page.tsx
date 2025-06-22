"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Check, X, Loader2, QrCode } from "lucide-react";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

// Correct dynamic import with proper typing
const QrReader = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading QR scanner...</span>
      </div>
    ),
  }
);

interface Registration {
  _id: string;
  eventId: string;
  username: string;
  registrationCode: string;
  numberOfGuests: number;
  event?: {
    name: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
  };
}

export default function TicketScannerPage() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  // Check admin authentication and camera permission on mount
  useEffect(() => {
    const token = Cookies.get("adminToken");
    const role = Cookies.get("adminRole");

    if (!token || role !== "TicketScanner") {
      router.push("/login");
      return;
    }

    checkCameraPermission();
  }, [router]);

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      return true;
    } catch (err: any) {
     
      setHasPermission(false);
      toast.error(`Camera access failed: ${err.message}`);
      return false;
    }
  };

  const startScanning = async () => {
    const hasPerm = await checkCameraPermission();
    if (hasPerm) {
      setShowScanner(true);
      setScannedData(null);
      setRegistration(null);
      setError("");
    }
  };

  const handleScan = (results: { rawValue: string }[]) => {
    if (results && results.length > 0 && !loading && !scannedData) {
      const result = results[0].rawValue;
      setScannedData(result);
      setShowScanner(false);
      verifyRegistration(result);
    }
  };

  const verifyRegistration = async (data: string) => {
    setLoading(true);
    setError("");
    setRegistration(null);

    try {
      const [username, registrationCode, eventId] = data.split("|");

      if (!username || !registrationCode || !eventId) {
        throw new Error("Invalid ticket format. Please scan a valid event ticket QR code.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/events/verify-registration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("adminToken")}`,
          },
          body: JSON.stringify({
            username,
            registrationCode,
            eventId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Verification failed. Please try again.");
      }

      const result = await response.json();
      setRegistration(result.registration);
      toast.success("Ticket verified successfully!");
    } catch (err: any) {
     
      
      let errorMessage = "Verification failed";
      if (err.message.includes("not found") || err.message.includes("not approved")) {
        errorMessage = "Ticket not found";
      } else if (err.message.includes("Invalid ticket format")) {
        errorMessage = err.message;
      } else if (err.message.includes("already occurred")) {
        errorMessage = "This event has already passed";
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err: unknown) => {
    const error = err instanceof Error ? err : new Error(String(err));
    setError(`Scanner error: ${error.message}`);
    setShowScanner(false);
    toast.error(`Scanner error: ${error.message}`);
  };

  const resetScanner = () => {
    setScannedData(null);
    setRegistration(null);
    setError("");
    setShowScanner(false);
  };

  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Camera Access Required</h2>
          <p className="text-gray-600 mb-4">
            Please enable camera permissions to use the QR scanner.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl px-6 py-2 mb-4 shadow-lg">
            <h1 className="text-base text-center font-bold text-white ">Event Ticket Scanner</h1>
          </div>

        {!scannedData ? (
          showScanner ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-800 text-white">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Scan QR Code
                </h2>
              </div>
              <div className="relative" style={{ width: "100%", height: "400px" }}>
                <QrReader
                  onScan={handleScan}
                  onError={handleError}
                  constraints={{ facingMode: "environment" }}
                  styles={{
                    container: { width: "100%", height: "100%", position: "relative" },
                    video: { objectFit: "cover" }
                  }}
                />
                <div className="absolute inset-0 border-4 border-blue-400 rounded-lg pointer-events-none"></div>
              </div>
              <div className="p-4 bg-gray-50 text-center">
                <button
                  onClick={() => setShowScanner(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel Scanning
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-800 text-white">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Ready to Scan
                </h2>
              </div>
              <div className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <QrCode className="h-24 w-24 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-6">
                  Click the button below to start scanning a ticket QR code
                </p>
                <button
                  onClick={startScanning}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 mx-auto"
                >
                  <QrCode className="h-5 w-5" />
                  Scan a Ticket
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-800 text-white">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : registration ? (
                  <Check className="h-5 w-5 text-green-400" />
                ) : (
                  <X className="h-5 w-5 text-red-400" />
                )}
                {loading
                  ? "Verifying..."
                  : registration
                  ? "Ticket Verified"
                  : "Verification Failed"}
              </h2>
            </div>

            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : registration ? (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Attendee Details</h3>
                    <p>
                      <span className="font-medium">Name:</span> {registration.username}
                    </p>
                    <p>
                      <span className="font-medium">Guests:</span>{" "}
                      {registration.numberOfGuests}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Event Details</h3>
                    <p>
                      <span className="font-medium">Event:</span> {registration.event?.name}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {registration.event?.date
                        ? new Date(registration.event.date).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Time:</span>{" "}
                      {registration.event?.startTime} - {registration.event?.endTime}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span>{" "}
                      {registration.event?.location}
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    onClick={resetScanner}
                    className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Scan Another Ticket
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="bg-red-100 text-red-800 p-4 rounded-md">
                  <h3 className="font-semibold mb-1">Could not verify ticket</h3>
                  <p>{error || "The ticket could not be verified"}</p>
                </div>
                <button
                  onClick={resetScanner}
                  className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}