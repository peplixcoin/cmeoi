"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend jsPDF interface to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable(options: {
      head: string[][];
      body: (string | number)[][];
      startY?: number;
      styles?: { fontSize?: number };
      columnStyles?: { [key: number]: { cellWidth?: number } };
    }): void;
  }
}

interface Rating {
  taste: number;
  service: number;
  hygiene: number;
  behavior: number;
}

interface Feedback {
  _id: string;
  username: string;
  order_id: string;
  ratings?: Rating; // Made optional to handle undefined
  comment: string;
  created_at: string;
  avgRating?: number;
}

const StarRating = ({ rating }: { rating: number }) => {
  const maxStars = 5;
  return (
    <div className="flex items-center">
      {[...Array(maxStars)].map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${
            i < rating ? "text-yellow-400" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
    </div>
  );
};

const RatingBreakdown = ({ ratings }: { ratings: Rating | undefined }) => {
  const safeRatings = ratings || {
    taste: 0,
    service: 0,
    hygiene: 0,
    behavior: 0,
  };

  return (
    <div className="text-left text-sm">
      <div className="flex justify-between">
        <span>Taste:</span>
        <span>{safeRatings.taste}/5</span>
      </div>
      <div className="flex justify-between">
        <span>Service:</span>
        <span>{safeRatings.service}/5</span>
      </div>
      <div className="flex justify-between">
        <span>Hygiene:</span>
        <span>{safeRatings.hygiene}/5</span>
      </div>
      <div className="flex justify-between">
        <span>Behavior:</span>
        <span>{safeRatings.behavior}/5</span>
      </div>
    </div>
  );
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function FeedbackPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dine" | "online">("dine");
  const [dineFeedbacks, setDineFeedbacks] = useState<Feedback[]>([]);
  const [onlineFeedbacks, setOnlineFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get("adminToken");
    const role = Cookies.get("adminRole");

    const fetchDineFeedbacks = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/feedback/dine/all`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch dine feedbacks");
        }
        const data = await response.json();
        setDineFeedbacks(data);
      } catch {
        setError("Error fetching dine feedbacks");
      }
    };

    const fetchOnlineFeedbacks = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/feedback/online/all`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch online feedbacks");
        }
        const data = await response.json();
        setOnlineFeedbacks(data);
      } catch {
        setError("Error fetching online feedbacks");
      }
    };

    const fetchAllFeedbacks = async () => {
      setLoading(true);
      await Promise.all([fetchDineFeedbacks(), fetchOnlineFeedbacks()]);
      setLoading(false);
    };

    if (!token) {
      router.push("/login");
    } else if (role !== "SuperAdmin") {
      if (role === "Manager") {
        router.push("/today-dine-orders");
      } else if (role === "Cook") {
        router.push("/cook");
      } else {
        router.push("/login");
      }
    } else {
      fetchAllFeedbacks();
    }
  }, [router]);

  const toggleExpandFeedback = (id: string) => {
    setExpandedFeedback(expandedFeedback === id ? null : id);
  };

  // Function to download feedback data as Excel
  const downloadExcel = () => {
    const feedbacks = activeTab === "dine" ? dineFeedbacks : onlineFeedbacks;
    const data = feedbacks.map((feedback) => ({
      Username: feedback.username || "N/A",
      "Order ID": feedback.order_id || "N/A",
      "Average Rating": feedback.avgRating?.toFixed(1) || "N/A",
      "Taste Rating": feedback.ratings?.taste ?? "N/A",
      "Service Rating": feedback.ratings?.service ?? "N/A",
      "Hygiene Rating": feedback.ratings?.hygiene ?? "N/A",
      "Behavior Rating": feedback.ratings?.behavior ?? "N/A",
      Comment: feedback.comment || "N/A",
      Date: formatDate(feedback.created_at) || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Feedbacks");
    XLSX.writeFile(
      workbook,
      `${activeTab === "dine" ? "DineIn" : "OnlineOrder"}-Feedbacks.xlsx`
    );
  };

  // Function to download feedback data as PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    const feedbacks = activeTab === "dine" ? dineFeedbacks : onlineFeedbacks;

    doc.text(
      `${activeTab === "dine" ? "Dine-in" : "Online Order"} Feedbacks`,
      14,
      10
    );

    doc.autoTable({
      head: [
        [
          "Username",
          "Order ID",
          "Avg Rating",
          "Taste",
          "Service",
          "Hygiene",
          "Behavior",
          "Comment",
          "Date",
        ],
      ],
      body: feedbacks.map((feedback) => [
        feedback.username || "N/A",
        feedback.order_id || "N/A",
        feedback.avgRating?.toFixed(1) || "N/A",
        feedback.ratings?.taste ? `${feedback.ratings.taste}/5` : "N/A",
        feedback.ratings?.service ? `${feedback.ratings.service}/5` : "N/A",
        feedback.ratings?.hygiene ? `${feedback.ratings.hygiene}/5` : "N/A",
        feedback.ratings?.behavior ? `${feedback.ratings.behavior}/5` : "N/A",
        feedback.comment || "N/A",
        formatDate(feedback.created_at) || "N/A",
      ]),
      startY: 20,
      styles: { fontSize: 8 },
      columnStyles: { 7: { cellWidth: 40 } },
    });

    doc.save(
      `${activeTab === "dine" ? "DineIn" : "OnlineOrder"}-Feedbacks.pdf`
    );
  };

  if (loading) {
    return <p className="text-center">Loading...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  const feedbacks = activeTab === "dine" ? dineFeedbacks : onlineFeedbacks;

  return (
    <div className="pt-4 pb-4 px-4 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-xl px-6 py-2 shadow-lg">
          <h1 className="text-base text-center font-bold text-white">Order Feedbacks</h1>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex justify-center mb-4">
          <button
            className={`px-4 py-2 mx-2 rounded-lg ${
              activeTab === "dine"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("dine")}
          >
            Dine-in Feedbacks
          </button>
          <button
            className={`px-4 py-2 mx-2 rounded-lg ${
              activeTab === "online"
                ? "bg-blue-500 text24-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("online")}
          >
            Online-order Feedbacks
          </button>
        </div>

        {/* Download Buttons */}
        <div className="flex justify-center mb-6 space-x-4">
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            onClick={downloadExcel}
          >
            Download Excel
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            onClick={downloadPDF}
          >
            Download PDF
          </button>
        </div>

        {feedbacks.length === 0 ? (
          <p className="text-center text-gray-600">
            No {activeTab === "dine" ? "dine-in" : "online-order"} feedbacks found.
          </p>
        ) : (
          <>
            {/* Table for larger screens */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2 border">Username</th>
                    <th className="p-2 border">Order ID</th>
                    <th className="p-2 border">Avg Rating</th>
                    <th className="p-2 border">Rating Breakdown</th>
                    <th className="p-2 border">Comment</th>
                    <th className="p-2 border">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((feedback) => (
                    <tr
                      key={feedback._id}
                      className="text-center border-b hover:bg-gray-50"
                    >
                      <td className="p-2 border">{feedback.username}</td>
                      <td className="p-2 border">{feedback.order_id}</td>
                      <td className="p-2 border">
                        <div className="flex justify-center">
                          <StarRating rating={feedback.avgRating || 0} />
                        </div>
                      </td>
                      <td className="p-2 border text-left">
                        <RatingBreakdown ratings={feedback.ratings} />
                      </td>
                      <td className="p-2 border max-w-xs truncate hover:text-clip text-sm">
                        {feedback.comment}
                      </td>
                      <td className="p-2 border">
                        {formatDate(feedback.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card-based layout for mobile screens */}
            <div className="md:hidden space-y-4">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback._id}
                  className="border p-4 rounded-lg shadow-md cursor-pointer"
                  onClick={() => toggleExpandFeedback(feedback._id)}
                >
                  <div className="flex justify-between">
                    <span className="font-semibold">Username:</span>
                    <span>{feedback.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Order ID:</span>
                    <span>{feedback.order_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Avg Rating:</span>
                    <StarRating rating={feedback.avgRating || 0} />
                  </div>
                  {expandedFeedback === feedback._id && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <div className="font-semibold mb-1">
                        Rating Breakdown:
                      </div>
                      <RatingBreakdown ratings={feedback.ratings} />
                      <div className="mt-2">
                        <div className="font-semibold">Comment:</div>
                        <p className="mt-1 text-sm">{feedback.comment}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-semibold">Date:</span>
                    <span>{formatDate(feedback.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}