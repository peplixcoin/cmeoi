"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Plus, Trash2, Edit, Calendar, Clock, MapPin } from "lucide-react";
import { toast } from "react-hot-toast";

interface Event {
  _id: string;
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
}

interface FormDataState {
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
  imageFile?: File;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    capacity: 50,
    isPaid: false,
    price: 0,
    guest_price: 0,
    imageUrl: "",
  });

  useEffect(() => {
    const token = Cookies.get("adminToken");
    const role = Cookies.get("adminRole");

    if (!token || role !== "SuperAdmin") {
      router.push("/login");
      return;
    }

    fetchEvents();
  }, [router]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("adminToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const convertTimeTo24Hour = (timeStr: string) => {
    if (!timeStr) return '';
    
    // Check if it's already in 24-hour format (contains :)
    if (timeStr.includes(':')) {
      // If it has AM/PM, convert it
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':');
        
        if (period === 'PM' && hours !== '12') {
          return `${String(Number(hours) + 12).padStart(2, '0')}:${minutes}`;
        } else if (period === 'AM' && hours === '12') {
          return `00:${minutes}`;
        }
        
        return `${hours.padStart(2, '0')}:${minutes}`;
      }
      // Otherwise assume it's already in 24-hour format
      return timeStr;
    }
    return '';
  };

  const convertTimeToAmPm = (timeStr: string) => {
    if (!timeStr) return '';
    
    const [hours, minutes] = timeStr.split(':');
    const hoursNum = parseInt(hours, 10);
    
    const period = hoursNum >= 12 ? 'PM' : 'AM';
    const displayHours = hoursNum % 12 || 12;
    
    return `${displayHours}:${minutes} ${period}`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    if (type === "file") {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        setFormData({
          ...formData,
          imageFile: files[0],
          imageUrl: "", // Clear imageUrl when new file is selected
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
      });
    }
  };

  const openAddModal = () => {
    setCurrentEvent(null);
    setFormData({
      name: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
      location: "",
      capacity: 50,
      isPaid: false,
      price: 0,
      guest_price: 0,
      imageUrl: "",
      imageFile: undefined,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (event: Event) => {
    setCurrentEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      date: event.date.split("T")[0],
      startTime: convertTimeTo24Hour(event.startTime),
      endTime: convertTimeTo24Hour(event.endTime),
      location: event.location,
      capacity: event.capacity,
      isPaid: event.isPaid,
      price: event.price || 0,
      guest_price: event.guest_price || 0,
      imageUrl: event.imageUrl || "",
      imageFile: undefined,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const timeAdjustedFormData = {
        ...formData,
        startTime: convertTimeToAmPm(formData.startTime),
        endTime: convertTimeToAmPm(formData.endTime),
      };

      const formDataToSend = new FormData();
      
      // Append all form data
      Object.entries(timeAdjustedFormData).forEach(([key, value]) => {
        if (key !== 'imageFile' && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      // Append the image file if it exists
      if (formData.imageFile) {
        formDataToSend.append('eventImage', formData.imageFile);
      }

      const url = currentEvent
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/events/${currentEvent.eventId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/events`;

      const method = currentEvent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${Cookies.get("adminToken")}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success(
        currentEvent ? "Event updated successfully!" : "Event created successfully!"
      );
      fetchEvents();
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${Cookies.get("adminToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      toast.success("Event deleted successfully!");
      fetchEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
       <div className="max-w-6xl mx-auto pt-4">
      {/* Add New Event Button */}
      <button
        onClick={openAddModal}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
      >
        <Plus size={18} />
        Add New Event
      </button>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length > 0 ? (
          events.map((event) => (
            <div
              key={event._id}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow relative"
            >
              <button
                onClick={() => openEditModal(event)}
                className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors z-20"
              >
                <Edit size={16} />
              </button>

              <div className="relative">
                <div className="w-full h-40 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      Event Image
                    </div>
                  )}
                </div>

                <span
                  className={`absolute top-2 left-2 px-2 py-1 text-xs rounded-full ${
                    event.isPaid
                      ? "bg-purple-100 text-purple-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {event.isPaid ? `₹${event.price}` : "Free"}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-sm">{event.name}</h3>

              <div className="space-y-1 text-sm text-gray-600 my-2">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-500" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-500" />
                  <span>
                    {event.startTime} - {event.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-500" />
                  <span>{event.location}</span>
                </div>
              </div>

              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                {event.description}
              </p>

              <div className="flex items-center justify-center">
                <button
                  onClick={() => handleDelete(event.eventId)}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-xs flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No events available.</p>
        )}
      </div>

      {/* Add/Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[40rem] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {currentEvent ? "Edit Event" : "Add New Event"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full mb-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="border p-2 rounded w-full mb-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full mb-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full mb-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full mb-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  min="1"
                  className="border p-2 rounded w-full mb-2"
                  required
                />
              </div>

              <div className="flex items-center mb-2">
                <label className="flex items-center mr-4">
                  <input
                    type="checkbox"
                    name="isPaid"
                    checked={formData.isPaid}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span>Paid Event</span>
                </label>
              </div>

              {formData.isPaid && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      className="border p-2 rounded w-full mb-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guest Price (₹)
                    </label>
                    <input
                      type="number"
                      name="guest_price"
                      value={formData.guest_price}
                      onChange={handleInputChange}
                      min="0"
                      className="border p-2 rounded w-full mb-2"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Image
                </label>
                <input
                  type="file"
                  name="imageFile"
                  onChange={handleInputChange}
                  accept="image/*"
                  className="border p-2 rounded w-full mb-4"
                />
                {formData.imageUrl && !formData.imageFile && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Current Image:</p>
                    <img 
                      src={formData.imageUrl} 
                      alt="Current event" 
                      className="h-20 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  {currentEvent ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}