"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Modal from "@/components/Modal";
import { use } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment-timezone";
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

interface Dignitary {
  rank: string;
  name: string;
  designation: string;
}

interface OwnArrangements {
  generatorBackup: boolean;
  additionalFurniture: boolean;
  additionalLighting: boolean;
}

interface BookingDetails {
  guestsCount: number;
  catering: "OI" | "Outsourced";
  additionalBarCounter: number;
  additionalWaiters: number;
  music: boolean;
  occasion: "private party" | "marriage function";
  dignitaries: Dignitary[];
  ownArrangements: OwnArrangements;
}

export default function LoungeDetails({
  params: paramsPromise,
}: {
  params: Promise<{ loungeId: string }>;
}) {
  const params = use(paramsPromise);

  const [lounge, setLounge] = useState<Lounge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [transactionId, setTransactionId] = useState("");
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    guestsCount: 0,
    catering: "OI",
    additionalBarCounter: 0,
    additionalWaiters: 0,
    music: false,
    occasion: "private party",
    dignitaries: [],
    ownArrangements: {
      generatorBackup: false,
      additionalFurniture: false,
      additionalLighting: false,
    },
  });
  const [totalCost, setTotalCost] = useState(0);
  const [bookingTotal, setBookingTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchLounge = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/lounges/${params.loungeId}`
        );
        if (!response.ok) throw new Error("Failed to fetch lounge");
        setLounge(await response.json());
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

    fetchLounge();
  }, [params.loungeId]);

  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/lounges/${params.loungeId}/booked-dates`
        );
        if (!response.ok) throw new Error("Failed to fetch booked dates");
        const data = await response.json();
        const dates = data.bookedDates.map((date: string) =>
          moment.tz(date, "YYYY-MM-DD", "Asia/Kolkata").toDate()
        );
        setBookedDates(dates);
      } catch (err) {
        console.error("Error fetching booked dates:", err);
      }
    };

    fetchBookedDates();
  }, [params.loungeId]);

  useEffect(() => {
    if (selectedDate) {
      const checkAvailability = async () => {
        try {
          const formattedDate = moment(selectedDate)
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD");
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/lounges/${params.loungeId}/availability/${formattedDate}`
          );
          if (!response.ok) throw new Error("Failed to check availability");
          const data = await response.json();
          setIsAvailable(data.isAvailable);
        } catch (err) {
          console.error("Error checking availability:", err);
          setIsAvailable(false);
        }
      };

      checkAvailability();
    }
  }, [selectedDate, params.loungeId]);

  useEffect(() => {
    if (lounge) {
      const deposit =
        bookingDetails.occasion === "marriage function" ? 10000 : 1000;
      const bookingTotal = lounge.cost + deposit;
      setBookingTotal(bookingTotal);

      let total = bookingTotal;

      if (bookingDetails.catering === "OI") {
        total += 3000;
      }

      total += bookingDetails.additionalBarCounter * 1500;
      total += bookingDetails.additionalWaiters * 1000;

      if (bookingDetails.music) {
        total += bookingDetails.occasion === "marriage function" ? 1000 : 500;
      }

      setTotalCost(total);
    }
  }, [lounge, bookingDetails]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    setBookingDetails((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNestedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    setBookingDetails((prev) => ({
      ...prev,
      ownArrangements: {
        ...prev.ownArrangements,
        [name]: checked,
      },
    }));
  };

  const handleAddDignitary = () => {
    setBookingDetails((prev) => ({
      ...prev,
      dignitaries: [
        ...prev.dignitaries,
        { rank: "", name: "", designation: "" },
      ],
    }));
  };

  const handleDignitaryChange = (
    index: number,
    field: keyof Dignitary,
    value: string
  ) => {
    const updatedDignitaries = [...bookingDetails.dignitaries];
    updatedDignitaries[index] = {
      ...updatedDignitaries[index],
      [field]: value,
    };

    setBookingDetails((prev) => ({
      ...prev,
      dignitaries: updatedDignitaries,
    }));
  };

  const handleRemoveDignitary = (index: number) => {
    const updatedDignitaries = [...bookingDetails.dignitaries];
    updatedDignitaries.splice(index, 1);

    setBookingDetails((prev) => ({
      ...prev,
      dignitaries: updatedDignitaries,
    }));
  };

  const handleSubmitBooking = async () => {
    const token = Cookies.get("token");
    const username = Cookies.get("username");

    if (!token || !username) {
      alert("Please sign in to book a lounge");
      router.push("/signin");
      return;
    }

    if (!selectedDate || !isAvailable) {
      alert("Please select an available date");
      return;
    }

    setShowBookingForm(true);
  };

  const handleConfirmBooking = async () => {
    if (!transactionId) {
      alert("Please enter transaction ID");
      return;
    }

    try {
      const token = Cookies.get("token");
      const username = Cookies.get("username");

      if (!token || !username) {
        alert("Please sign in to book a lounge");
        router.push("/signin");
        return;
      }

      const formattedDate = moment(selectedDate)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lounges/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          loungeId: lounge?._id,
          bookingDate: formattedDate,
          guestsCount: Number(bookingDetails.guestsCount),
          catering: bookingDetails.catering,
          additionalBarCounter: Number(bookingDetails.additionalBarCounter),
          additionalWaiters: Number(bookingDetails.additionalWaiters),
          music: Boolean(bookingDetails.music),
          occasion: bookingDetails.occasion,
          securityDeposit:
            bookingDetails.occasion === "marriage function" ? 10000 : 1000,
          bookingTotal: Number(bookingTotal),
          totalCost: Number(totalCost),
          ownArrangements: bookingDetails.ownArrangements,
          dignitaries: bookingDetails.dignitaries.map((d) => ({
            rank: String(d.rank),
            name: String(d.name),
            designation: String(d.designation),
          })),
          transactionId: String(transactionId),
          username: username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Booking failed");
      }

      await response.json();
      alert("Booking submitted successfully! Status: Pending");
      router.push("/lounge-booking/bookings");
    } catch (error: unknown) {
      console.error("Booking error:", error);
      let errorMessage = "Booking failed. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    }
  };

  if (loading)
    return <div className="text-center py-20 text-gray-600">Loading...</div>;
  if (error)
    return <div className="text-center py-20 text-red-500">Error: {error}</div>;
  if (!lounge)
    return (
      <div className="text-center py-20 text-gray-600">Lounge not found</div>
    );

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-1/2 p-4 sm:p-6">
              <div className="h-56 sm:h-80 rounded-lg overflow-hidden shadow-md mb-4 relative">
                {lounge.photos && lounge.photos.length > 0 ? (
                  <img
                    src={lounge.photos[currentPhotoIndex]}
                    alt={`${lounge.name} - Photo ${currentPhotoIndex + 1}`}
                    className="w-full h-full object-cover transition-all duration-300 ease-in-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    No Image Available
                  </div>
                )}
                {lounge.photos && lounge.photos.length > 1 && (
                  <div className="absolute bottom-2 left-2 right-2 flex space-x-2 overflow-x-auto p-1">
                    {lounge.photos.map((photoUrl, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden border-2 transition-all duration-200
                          ${
                            currentPhotoIndex === index
                              ? "border-blue-500 shadow-md"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                      >
                        <img
                          src={photoUrl}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="sm:w-1/2 p-4 sm:p-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                {lounge.name}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mb-4 leading-relaxed">
                {lounge.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Capacity</p>
                  <p className="font-medium text-sm sm:text-base">
                    {lounge.capacity} guests
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Base Cost</p>
                  <p className="font-medium text-sm sm:text-base">
                    ₹{lounge.cost.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Bar Counters
                  </p>
                  <p className="font-medium text-sm sm:text-base">
                    {lounge.barCounters}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Waiters</p>
                  <p className="font-medium text-sm sm:text-base">
                    {lounge.waiters}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Date
                </label>
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  minDate={moment().tz("Asia/Kolkata").toDate()}
                  excludeDates={bookedDates}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select a date"
                />
                {selectedDate && (
                  <p
                    className={`mt-1 text-sm ${
                      isAvailable ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isAvailable
                      ? "Available for booking"
                      : "Not available for booking"}
                  </p>
                )}
              </div>

              <button
                onClick={handleSubmitBooking}
                disabled={!isAvailable}
                className={`w-full py-2.5 px-4 rounded-md text-white font-medium text-sm sm:text-base transition-all duration-200
                  ${
                    isAvailable
                      ? "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
              >
                Book This Lounge
              </button>
            </div>
          </div>
        </div>
        <div>
          <p className="text-base text-center text-gray-800 p-2 mt-3">
            Please read these{" "}
            <a className="text-blue-600" href="/lounge-booking/instructions">
              instructions
            </a>{" "}
            before booking a facility
          </p>
        </div>

        {showBookingForm && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
              Booking Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Guests
                </label>
                <input
                  type="number"
                  name="guestsCount"
                  min="1"
                  max={lounge.capacity}
                  value={bookingDetails.guestsCount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catering Option
                </label>
                <select
                  name="catering"
                  value={bookingDetails.catering}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="OI">OI Catering (₹3000)</option>
                  <option value="Outsourced">Bring Your Own</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Bar Counters (₹1500 each)
                </label>
                <input
                  type="number"
                  name="additionalBarCounter"
                  min="0"
                  value={bookingDetails.additionalBarCounter}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Waiters (₹1000 each)
                </label>
                <input
                  type="number"
                  name="additionalWaiters"
                  min="0"
                  value={bookingDetails.additionalWaiters}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Occasion Type
                </label>
                <select
                  name="occasion"
                  value={bookingDetails.occasion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="private party">
                    Private Party (₹1000 deposit)
                  </option>
                  <option value="marriage function">
                    Marriage Function (₹10000 deposit)
                  </option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="music"
                  checked={bookingDetails.music}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Music (
                  {bookingDetails.occasion === "marriage function"
                    ? "₹1000"
                    : "₹500"}
                  )
                </label>
              </div>

              <div className="sm:col-span-2">
                <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2">
                  Own Arrangements
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="generatorBackup"
                      checked={bookingDetails.ownArrangements.generatorBackup}
                      onChange={handleNestedChange}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Generator Backup
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="additionalFurniture"
                      checked={
                        bookingDetails.ownArrangements.additionalFurniture
                      }
                      onChange={handleNestedChange}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Additional Furniture
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="additionalLighting"
                      checked={
                        bookingDetails.ownArrangements.additionalLighting
                      }
                      onChange={handleNestedChange}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Additional Lighting
                    </label>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base sm:text-lg font-medium text-gray-800">
                    Dignitaries
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddDignitary}
                    className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    + Add Dignitary
                  </button>
                </div>

                {bookingDetails.dignitaries.map((dignitary, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Rank
                      </label>
                      <input
                        type="text"
                        value={dignitary.rank}
                        onChange={(e) =>
                          handleDignitaryChange(index, "rank", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Rank"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={dignitary.name}
                        onChange={(e) =>
                          handleDignitaryChange(index, "name", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Name"
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">
                          Designation
                        </label>
                        <input
                          type="text"
                          value={dignitary.designation}
                          onChange={(e) =>
                            handleDignitaryChange(
                              index,
                              "designation",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Designation"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDignitary(index)}
                        className="ml-2 px-2 py-1 text-sm text-red-600 hover:text-red-800 focus:outline-none"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3">
                Pricing Summary
              </h3>
              <div className="space-y-2 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span>Lounge Base Cost</span>
                  <span>₹{lounge.cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Security Deposit</span>
                  <span>
                    ₹
                    {bookingDetails.occasion === "marriage function"
                      ? "10,000"
                      : "1,000"}
                  </span>
                </div>
                {bookingDetails.catering === "OI" && (
                  <div className="flex justify-between">
                    <span>Catering (OI)</span>
                    <span>₹3,000</span>
                  </div>
                )}
                {bookingDetails.additionalBarCounter > 0 && (
                  <div className="flex justify-between">
                    <span>
                      Additional Bar Counters (
                      {bookingDetails.additionalBarCounter})
                    </span>
                    <span>
                      ₹
                      {(
                        bookingDetails.additionalBarCounter * 1500
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
                {bookingDetails.additionalWaiters > 0 && (
                  <div className="flex justify-between">
                    <span>
                      Additional Waiters ({bookingDetails.additionalWaiters})
                    </span>
                    <span>
                      ₹
                      {(
                        bookingDetails.additionalWaiters * 1000
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
                {bookingDetails.music && (
                  <div className="flex justify-between">
                    <span>Music</span>
                    <span>
                      ₹
                      {bookingDetails.occasion === "marriage function"
                        ? "1,000"
                        : "500"}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between font-semibold">
                  <span>Booking Total (to pay now)</span>
                  <span>₹{bookingTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Additional Services</span>
                  <span>₹{(totalCost - bookingTotal).toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between font-bold text-base sm:text-lg">
                  <span>Total Estimated Cost</span>
                  <span>₹{totalCost.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full mt-4 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base transition-all duration-200"
              >
                Pay Now (₹{bookingTotal.toLocaleString()})
              </button>
            </div>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <Modal onClose={() => setShowPaymentModal(false)}>
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
              Complete Payment
            </h2>

            <div className="mb-6 text-center">
              <p className="mb-3 text-sm sm:text-base text-gray-600">
                Scan the QR code to pay ₹{bookingTotal.toLocaleString()}
              </p>
              <div className="bg-gray-100 p-3 rounded-lg inline-block mb-3 border border-gray-200">
                <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center bg-white relative">
                  <div className="absolute inset-0 bg-[url('/qr-placeholder.png')] bg-cover opacity-50"></div>
                  <span className="text-gray-500 text-xs sm:text-sm">
                    QR Code Placeholder
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-3">OR</p>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base transition-all duration-200">
                Click to Pay
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction ID
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                placeholder="Enter transaction ID after payment"
                required
            />
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={!transactionId}
              className={`w-full py-2.5 px-4 rounded-md text-white font-medium text-sm sm:text-base transition-all duration-200
                ${
                  transactionId
                    ? "bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
            >
              Confirm Booking
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}