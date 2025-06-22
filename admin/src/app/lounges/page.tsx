"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Plus, Trash2, Edit, Loader2, UploadCloud, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";

// Interface for Lounge data
interface Lounge {
  _id: string;
  name: string;
  description: string;
  photos: string[]; // Array of image URLs from Cloudinary
  capacity: number;
  cost: number;
  barCounters: number;
  waiters: number;
}

// Initial form data structure
const initialFormData = {
  name: "",
  description: "",
  capacity: 50,
  cost: 5000,
  barCounters: 1,
  waiters: 3,
  photoFiles: [] as File[], // For new image files to upload
  existingPhotos: [] as string[], // URLs of current photos when editing
};

const MAX_PHOTOS = 5;

export default function AdminLoungesPage() {
  const [lounges, setLounges] = useState<Lounge[]>([]);
  const [loading, setLoading] = useState(true); // For loading lounges list
  const [formLoading, setFormLoading] = useState(false); // For form submission
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLounge, setCurrentLounge] = useState<Lounge | null>(null); // For editing
  const router = useRouter();

  const [formData, setFormData] = useState(initialFormData);

  // Effect for initial setup and fetching lounges
  useEffect(() => {
    const token = Cookies.get("adminToken");
    const role = Cookies.get("adminRole");

    if (!token || role !== "SuperAdmin") {
      router.push("/login");
      return;
    }
    fetchLounges();
  }, [router]);

  const fetchLounges = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lounges`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("adminToken")}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to fetch lounges");
      }
      const data = await response.json();
      setLounges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error(err instanceof Error ? err.message : "Could not load lounges.");
    } finally {
      setLoading(false);
    }
  };

  // Input handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof initialFormData
  ) => {
    const value = parseInt(e.target.value) || 0;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const currentTotalPhotos = (formData.existingPhotos?.length || 0) + formData.photoFiles.length;

      if (currentTotalPhotos + newFiles.length > MAX_PHOTOS) {
        toast.error(`You can select a maximum of ${MAX_PHOTOS} photos in total.`);
        // Optionally, only take enough files to reach the limit:
        const filesToAdd = newFiles.slice(0, MAX_PHOTOS - currentTotalPhotos);
        if (filesToAdd.length > 0) {
             setFormData(prev => ({
                ...prev,
                photoFiles: [...prev.photoFiles, ...filesToAdd],
             }));
        }
        e.target.value = ""; // Reset file input
        return;
      }
      setFormData(prev => ({
        ...prev,
        photoFiles: [...prev.photoFiles, ...newFiles],
      }));
      e.target.value = ""; // Reset file input to allow selecting the same file again if removed
    }
  };

  const removeNewPhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photoFiles: prev.photoFiles.filter((_, i) => i !== index),
    }));
  };

  const removeExistingPhoto = (urlToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      existingPhotos: prev.existingPhotos.filter(url => url !== urlToRemove),
    }));
    // This photo will not be included in the 'photosToKeep' or 'photos' array sent to backend for update.
    // The backend needs logic to compare and delete from Cloudinary if a URL is no longer present.
  };


  // Modal handlers
  const openAddModal = () => {
    setCurrentLounge(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (lounge: Lounge) => {
    setCurrentLounge(lounge);
    setFormData({
      name: lounge.name,
      description: lounge.description,
      capacity: lounge.capacity,
      cost: lounge.cost,
      barCounters: lounge.barCounters,
      waiters: lounge.waiters,
      photoFiles: [], // Clear new files when opening edit
      existingPhotos: lounge.photos || [],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentLounge(null);
    setFormData(initialFormData); // Reset form
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const dataPayload = new FormData();
    dataPayload.append('name', formData.name);
    dataPayload.append('description', formData.description);
    dataPayload.append('capacity', String(formData.capacity));
    dataPayload.append('cost', String(formData.cost));
    dataPayload.append('barCounters', String(formData.barCounters));
    dataPayload.append('waiters', String(formData.waiters));

    // Append new photo files
    formData.photoFiles.forEach(file => {
      dataPayload.append('photos', file); // Backend expects 'photos' for new files
    });

    // For updates, send the list of existing photo URLs that should be kept.
    // The backend should use this to manage existing photos.
    if (currentLounge) {
      // This 'photos' field in FormData (if also used for new files) might cause issues
      // if backend multer uses it for new files only.
      // It's often better to use a distinct field for existing photos, e.g., 'photosToKeep'.
      // Assuming the backend's `updateLounge` handles `req.body.photos` as JSON string array of existing URLs
      // and `req.files` (named 'photos') for new image files.
      dataPayload.append('existingPhotosToKeep', JSON.stringify(formData.existingPhotos));
    }


    try {
      const url = currentLounge
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/lounges/${currentLounge._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/lounges`;
      const method = currentLounge ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${Cookies.get("adminToken")}`,
          // Content-Type is set automatically by browser for FormData
        },
        body: dataPayload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || (currentLounge ? "Failed to update lounge" : "Failed to create lounge"));
      }

      toast.success(`Lounge ${currentLounge ? "updated" : "created"} successfully!`);
      fetchLounges();
      closeModal();
    } catch (err) {
      console.error("Form submission error:", err);
      toast.error(err instanceof Error ? err.message : "An submission error occurred.");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete lounge
  const handleDelete = async (loungeId: string) => {
    if (!confirm("Are you sure you want to delete this lounge and all its associated bookings and images? This action cannot be undone.")) return;

    setFormLoading(true); // Can use a specific deleting state if preferred
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/lounges/${loungeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${Cookies.get("adminToken")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete lounge");
      }
      toast.success("Lounge deleted successfully!");
      fetchLounges(); // Refresh the list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete lounge.");
    } finally {
      setFormLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error && lounges.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="text-red-600 text-center bg-red-100 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Error Loading Lounges</h2>
          <p>{error}</p>
          <button
            onClick={fetchLounges}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Manage Lounges</h1>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2"
          >
            <Plus size={20} />
            Add New Lounge
          </button>
        </div>

        {lounges.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow">
            <UploadCloud size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-xl">No lounges found.</p>
            <p className="mt-2">Click "Add New Lounge" to get started.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lounges.map(lounge => (
            <div
              key={lounge._id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="h-48 w-full overflow-hidden">
                {lounge.photos && lounge.photos.length > 0 ? (
                  <img
                    src={lounge.photos[0]} // Display first photo as cover
                    alt={lounge.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold text-gray-800 mb-2 truncate">{lounge.name}</h3>
                <p className="text-sm text-gray-600 mb-1 line-clamp-2 h-10">{lounge.description}</p>
                <div className="text-xs text-gray-500 mb-3">
                  <span>Capacity: {lounge.capacity}</span> |
                  <span> Cost: ₹{lounge.cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openEditModal(lounge)}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    title="Edit Lounge"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(lounge._id)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Delete Lounge"
                    disabled={formLoading}
                  >
                    {formLoading && currentLounge?._id !== lounge._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Lounge Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                {currentLounge ? "Edit Lounge" : "Add New Lounge"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    <XCircle size={24} />
                </button>
            </div>


            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input id="name" type="text" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" required />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input id="capacity" type="number" min="1" value={formData.capacity} onChange={e => handleNumberInputChange(e, 'capacity')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" required />
                </div>
                <div>
                  <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">Cost (₹)</label>
                  <input id="cost" type="number" min="0" value={formData.cost} onChange={e => handleNumberInputChange(e, 'cost')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="barCounters" className="block text-sm font-medium text-gray-700 mb-1">Bar Counters</label>
                  <input id="barCounters" type="number" min="0" value={formData.barCounters} onChange={e => handleNumberInputChange(e, 'barCounters')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" required />
                </div>
                <div>
                  <label htmlFor="waiters" className="block text-sm font-medium text-gray-700 mb-1">Waiters</label>
                  <input id="waiters" type="number" min="0" value={formData.waiters} onChange={e => handleNumberInputChange(e, 'waiters')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" required />
                </div>
              </div>

              {/* Photo Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lounge Photos (Max {MAX_PHOTOS} total)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="photoFiles"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
                      >
                        <span>Upload files</span>
                        <input id="photoFiles" name="photoFiles" type="file" className="sr-only" multiple accept="image/*" onChange={handleFileChange} disabled={(formData.existingPhotos?.length || 0) + formData.photoFiles.length >= MAX_PHOTOS} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
                    <p className="text-xs text-gray-500">
                        { (formData.existingPhotos?.length || 0) + formData.photoFiles.length } / {MAX_PHOTOS} photos selected
                    </p>
                  </div>
                </div>

                {/* Display Existing Photos (for editing mode) */}
                {currentLounge && formData.existingPhotos && formData.existingPhotos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Current photos (click X to mark for removal):</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {formData.existingPhotos.map((photoUrl, index) => (
                        <div key={`existing-${index}`} className="relative group aspect-square">
                          <img src={photoUrl} alt={`Lounge photo ${index + 1}`} className="w-full h-full object-cover rounded-md shadow" />
                          <button
                            type="button"
                            onClick={() => removeExistingPhoto(photoUrl)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-75 group-hover:opacity-100 transition-opacity"
                            title="Mark to remove this photo"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Display New Photo Previews */}
                {formData.photoFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">New photos to upload:</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {formData.photoFiles.map((file, index) => (
                        <div key={`new-${index}`} className="relative group aspect-square">
                          <img src={URL.createObjectURL(file)} alt={`New photo preview ${index + 1}`} className="w-full h-full object-cover rounded-md shadow" />
                           <button
                            type="button"
                            onClick={() => removeNewPhoto(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-75 group-hover:opacity-100 transition-opacity"
                            title="Remove this photo"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>


              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 flex items-center justify-center"
                  disabled={formLoading || ((formData.existingPhotos?.length || 0) + formData.photoFiles.length === 0 && !currentLounge) } // Disable if no photos for new lounge
                >
                  {formLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : null}
                  {currentLounge ? "Update Lounge" : "Create Lounge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}