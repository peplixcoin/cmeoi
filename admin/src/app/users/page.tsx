"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
// No Link component needed here unless you add navigation similar to HomePage

interface GuestUser {
  _id: string;
  Username: string;
  Name: string;
  mobile_no: string;
  email: string;
  address: string;
}

interface FormDataState {
  service: string;
  Name: string;
  Password: string;
  mobile_no: string;
  email: string;
  address: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<GuestUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormDataState>({
    service: "",
    Name: "",
    Password: "",
    mobile_no: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    const token = Cookies.get("adminToken");
    const role = Cookies.get("adminRole");

    if (!token || role !== "SuperAdmin") {
      // Basic role check, actual redirection logic from reference is not fully applicable here
      // but if you need redirection based on other roles for this page, it can be added.
      router.push("/login");
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/guest`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Failed to fetch users" }));
          throw new Error(errorData.message || "Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get("adminToken");
    setError(null); // Clear previous errors

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/guest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to add user" }));
        throw new Error(errorData.message || "Failed to add user");
      }

      const newUserResponse = await response.json();
      // Assuming the API returns { user: GuestUser } or similar structure
      setUsers((prev) => [...prev, newUserResponse.user || newUserResponse]);
      setFormData({
        // Reset form
        service: "",
        Name: "",
        Password: "",
        mobile_no: "",
        email: "",
        address: "",
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const token = Cookies.get("adminToken");
    setError(null); // Clear previous errors

    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/guest/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to delete user" }));
        throw new Error(errorData.message || "Failed to delete user");
      }

      setUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50 p-4">
        <p className="text-xl font-semibold text-slate-700">Loading Users...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-8 shadow-md max-w-3xl mx-auto"
            role="alert"
          >
            <p className="font-bold">Operation Failed</p>
            <p>{error}</p>
          </div>
        )}

        {/* Add User Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-10 max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl py-2 shadow-lg">
            <h1 className="text-base text-center font-bold text-white ">
              Add New Guest User
            </h1>
          </div>
          <form onSubmit={handleAddUser} className="space-y-5 mt-4">
            <div>
              <label
                htmlFor="service"
                className="block text-sm font-medium text-slate-600 mb-1"
              >
                Service / Category
              </label>
              <select
                id="service"
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                className="mt-1 block w-full h-12 px-4 rounded-lg border border-slate-300 shadow-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                required
              >
                <option value="">Select Service</option>
                <option value="1">Army</option>
                <option value="2">Navy</option>
                <option value="3">Airforce</option>
                <option value="4">Cadet</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="Name"
                className="block text-sm font-medium text-slate-600 mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="Name"
                name="Name"
                value={formData.Name}
                onChange={handleInputChange}
                className="mt-1 block w-full h-12 px-4 rounded-lg border border-slate-300 shadow-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                required
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label
                htmlFor="Password"
                className="block text-sm font-medium text-slate-600 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="Password"
                name="Password"
                value={formData.Password}
                onChange={handleInputChange}
                className="mt-1 block w-full h-12 px-4 rounded-lg border border-slate-300 shadow-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                required
                placeholder="Create a password"
              />
            </div>

            <div>
              <label
                htmlFor="mobile_no"
                className="block text-sm font-medium text-slate-600 mb-1"
              >
                Mobile Number
              </label>
              <input
                type="text"
                id="mobile_no"
                name="mobile_no"
                value={formData.mobile_no}
                onChange={handleInputChange}
                className="mt-1 block w-full h-12 px-4 rounded-lg border border-slate-300 shadow-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                required
                placeholder="Enter mobile number"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-600 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full h-12 px-4 rounded-lg border border-slate-300 shadow-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                required
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-slate-600 mb-1"
              >
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="mt-1 block w-full h-12 px-4 rounded-lg border border-slate-300 shadow-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                required
                placeholder="Enter full address"
              />
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="w-4xl bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition duration-150 ease-in-out text-base"
              >
                Add Guest User
              </button>
            </div>
          </form>
        </div>

        {/* Users List Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-slate-700 tracking-tight">
            Current Guest Users
          </h2>
          {users.length === 0 ? (
            <p className="text-slate-500 text-center py-4">
              No guest users found. Add one using the form above.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 sm:px-6 sm:py-3.5 text-left text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Username
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 sm:px-6 sm:py-3.5 text-left text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 sm:px-6 sm:py-3.5 text-left text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Mobile
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 sm:px-6 sm:py-3.5 text-left text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 sm:px-6 sm:py-3.5 text-left text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Address
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 sm:px-6 sm:py-3.5 text-left text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-slate-800 font-medium">
                        {user.Username}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-slate-600">
                        {user.Name}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-slate-600">
                        {user.mobile_no}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-slate-600">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-slate-600 max-w-xs truncate">
                        {user.address}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-700 font-semibold py-1 px-2 rounded-md hover:bg-red-50 transition-all duration-150 ease-in-out"
                          aria-label={`Delete user ${user.Name}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
