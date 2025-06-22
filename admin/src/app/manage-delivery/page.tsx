"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface Cook {
  _id: string;
  Username: string;
  mobile_no: string;
  role: string;
  password?: string;
}

interface NewCook {
  username: string;
  password: string;
  mobile_no: string;
}

export default function CooksPage() {
  const router = useRouter();
  const [cooks, setCooks] = useState<Cook[]>([]);
  const [newCook, setNewCook] = useState<NewCook>({
    username: "",
    password: "",
    mobile_no: ""
  });
  const [editCook, setEditCook] = useState<Cook | null>(null);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    const token = Cookies.get("adminToken");
    if (!token) {
      router.push("/login");
    } else {
      fetchCooks();
    }
  }, [router]);

  const fetchCooks = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/deliverymen`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("adminToken")}`
        }
      });
      const data = await response.json();
      setCooks(data);
    } catch (error) {
      console.error("Error fetching cooks:", error);
    }
  };

  const handleCreateCook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/deliverymen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("adminToken")}`
        },
        body: JSON.stringify(newCook)
      });
      
      if (!response.ok) throw new Error("Failed to create cook");
      await fetchCooks();
      setNewCook({ username: "", password: "", mobile_no: "" });
    } catch (error) {
      console.error("Error creating cook:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCook) return;
    setLoading(true);
    
    try {
      const updateData = {
        username: editCook.Username,
        mobile_no: editCook.mobile_no,
        ...(editCook.password && { password: editCook.password })
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/deliverymen/${editCook._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("adminToken")}`
          },
          body: JSON.stringify(updateData)
        }
      );

      if (!response.ok) throw new Error("Failed to update cook");
      await fetchCooks();
      setEditCook(null);
    } catch (error) {
      console.error("Error updating cook:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCook = async (deliverymanId: string) => {
    if (!window.confirm("Are you sure you want to delete this cook?")) return;
    setLoading(true);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/deliverymen/${deliverymanId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${Cookies.get("adminToken")}`
          }
        }
      );

      if (!response.ok) throw new Error("Failed to delete cook");
      await fetchCooks();
    } catch (error) {
      console.error("Error deleting cook:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-xl px-6 py-2 shadow-lg">
            <h1 className="text-base text-center font-bold text-white ">Delivery Management</h1>
          </div>
          <div className="bg-white rounded-b-xl shadow-lg p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                <form onSubmit={handleCreateCook} className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-xl font-medium text-gray-800 mb-4">Add New Delivery Person</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Username"
                        value={newCook.username}
                        onChange={(e) => setNewCook({...newCook, username: e.target.value})}
                        className="pl-10 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                        required
                      />
                    </div>
                    <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <input
                        type="password"
                        placeholder="Password"
                        value={newCook.password}
                        onChange={(e) => setNewCook({...newCook, password: e.target.value})}
                        className="pl-10 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                        required
                      />
                    </div>
                    <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Mobile Number"
                        value={newCook.mobile_no}
                        onChange={(e) => setNewCook({...newCook, mobile_no: e.target.value})}
                        className="pl-10 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className={`mt-6 w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg shadow-sm hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-150 flex items-center justify-center ${
                      isLoading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                    disabled={isLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {isLoading ? "Adding..." : "Add Delivery Person"}
                  </button>
                </form>

                {cooks.length > 0 ? (
                  <div className="space-y-6">
                    {cooks.map((cook) => (
                      <div key={cook._id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex justify-between items-start p-4 border-b border-gray-200">
                          <div>
                            <h3 className="text-lg font-medium text-gray-800">{cook.Username}</h3>
                            <p className="text-sm text-gray-600 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                              </svg>
                              {cook.mobile_no}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditCook({
                                ...cook,
                                password: ""
                              })}
                              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium rounded-lg shadow-sm hover:from-yellow-600 hover:to-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 transition-all duration-150 flex items-center justify-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.379-8.379-2.828-2.828z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCook(cook._id)}
                              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-lg shadow-sm hover:from-red-600 hover:to-red-700 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-150 flex items-center justify-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>

                        {editCook?._id === cook._id && (
                          <form onSubmit={handleUpdateCook} className="p-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                <input
                                  type="text"
                                  value={editCook.Username}
                                  onChange={(e) => setEditCook({
                                    ...editCook,
                                    Username: e.target.value
                                  })}
                                  className="pl-10 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                                  required
                                />
                              </div>
                              <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                <input
                                  type="text"
                                  value={editCook.mobile_no}
                                  onChange={(e) => setEditCook({
                                    ...editCook,
                                    mobile_no: e.target.value
                                  })}
                                  className="pl-10 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                                  required
                                />
                              </div>
                              <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <input
                                  type="password"
                                  placeholder="New Password (leave blank to keep current)"
                                  value={editCook.password || ""}
                                  onChange={(e) => setEditCook({
                                    ...editCook,
                                    password: e.target.value
                                  })}
                                  className="pl-10 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                                />
                              </div>
                            </div>
                            <div className="mt-6 flex gap-2">
                              <button
                                type="submit"
                                className={`px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg shadow-sm hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-150 flex items-center justify-center ${
                                  isLoading ? "opacity-75 cursor-not-allowed" : ""
                                }`}
                                disabled={isLoading}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {isLoading ? "Saving..." : "Save Changes"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditCook(null)}
                                className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-medium rounded-lg shadow-sm hover:from-gray-600 hover:to-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-all duration-150 flex items-center justify-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-800">No delivery personnel</h3>
                    <p className="text-gray-500 mt-1">Add a new delivery person to get started</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}