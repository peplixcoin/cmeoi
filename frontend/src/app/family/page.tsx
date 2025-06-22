"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";

type FamilyMember = {
  username: string;
  relation: number;
  name: string;
};

const relationTypes = [
  { value: 2, label: "Wife" },
  { value: 3, label: "Son" },
  { value: 4, label: "Daughter" },
  { value: 5, label: "Parent" },
];

export default function FamilyPage() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [newMember, setNewMember] = useState({
    relation: 2,
    password: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = Cookies.get("token");
      const username = Cookies.get("username");

      if (!token || !username) {
        router.push("/signin");
        return;
      }

      try {
        // Fetch user details
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${username}`);
        if (!res.ok) throw new Error("Failed to fetch user data");
        const data = await res.json();

        setUserData({
          username,
          address: data.address,
          mobile_no: data.mobile_no,
          role: data.role,
        });

        // Fetch family members (only for main members)
        if (data.role !== "family") {
          const familyRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/user/${username}/family`
          );
          if (familyRes.ok) {
            const familyData = await familyRes.json();
            setFamilyMembers(familyData);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const generateFamilyUsername = (relation: number) => {
    if (!userData?.username) return "";

    // Remove the last character (which is 1 for main user)
    const baseUsername = userData.username.slice(0, -1);
    return `${baseUsername}${relation}`;
  };

  const handleAddMember = async () => {
    const familyUsername = generateFamilyUsername(newMember.relation);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/family`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
        body: JSON.stringify({
          username: familyUsername,
          relation: newMember.relation,
          password: newMember.password,
          mainUsername: userData.username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400 && errorData.message === "Family member already exists") {
          throw new Error(`A family member with the relation "${relationTypes.find((t) => t.value === newMember.relation)?.label}" already exists.`);
        }
        throw new Error(errorData.message || "Failed to add family member");
      }

      const addedMember = await response.json();

      setFamilyMembers([...familyMembers, addedMember]);
      setNewMember({ relation: 2, password: "" });
      setSuccess("Family member added successfully!");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add family member");
      setSuccess("");
    }
  };

  const handleDeleteMember = async (familyUsername: string) => {
    if (!window.confirm(`Are you sure you want to delete ${familyUsername}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/family/${familyUsername}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
          body: JSON.stringify({
            mainUsername: userData.username,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setFamilyMembers(
        familyMembers.filter((member) => member.username !== familyUsername)
      );
      setSuccess("Family member deleted successfully!");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete family member");
      setSuccess("");
    }
  };

  // Determine relation for family member
  const getRelationLabel = () => {
    if (userData?.role === "family") {
      const relationValue = parseInt(userData.username.slice(-1));
      const relation = relationTypes.find((type) => type.value === relationValue);
      return relation ? relation.label : "Unknown";
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="mb-6 text-gray-600 text-sm sm:text-base">You need to be signed in to view this page.</p>
          <Link
            href="/signin"
            className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-all duration-300 font-medium text-sm sm:text-base"
            aria-label="Sign in to access family management"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-8 px-4 sm:px-6 ">
       <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl px-6 py-2 mb-4 shadow-lg">
            <h1 className="text-base text-center font-bold text-white ">Manage Family Members</h1>
          </div>
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
         

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300 text-sm sm:text-base font-semibold text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg border border-green-300 text-sm sm:text-base font-semibold text-center">
            {success}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Your Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <p className="mt-1 text-sm sm:text-base text-gray-900">{userData.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
              <p className="mt-1 text-sm sm:text-base text-gray-900">{userData.mobile_no}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <p className="mt-1 text-sm sm:text-base text-gray-900">{userData.address}</p>
            </div>
            {userData.role === "family" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Relation to Main User</label>
                <p className="mt-1 text-sm sm:text-base text-gray-900">{getRelationLabel()}</p>
              </div>
            )}
          </div>
        </div>

        {userData.role !== "family" && (
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Add Family Member</h2>
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="relation"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Relationship
                </label>
                <div className="relative">
                  <select
                    id="relation"
                    value={newMember.relation}
                    onChange={(e) =>
                      setNewMember({ ...newMember, relation: parseInt(e.target.value) })
                    }
                    className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 appearance-none transition-all duration-300 text-sm sm:text-base cursor-pointer"
                    aria-label="Select relationship"
                  >
                    {relationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-5 sm:w-6 h-5 sm:h-6 text-gray-500 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Family Member Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={newMember.password}
                  onChange={(e) =>
                    setNewMember({ ...newMember, password: e.target.value })
                  }
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-300 text-sm sm:text-base"
                  placeholder="Enter password for family member"
                  aria-label="Enter password for family member"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Generated Username
                </label>
                <p className="text-sm sm:text-base text-gray-900">
                  {generateFamilyUsername(newMember.relation)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Note: Family members will use this username and the password you set to sign in.
                </p>
              </div>

              <button
                onClick={handleAddMember}
                disabled={!newMember.password}
                className="w-full py-3 sm:py-4 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-all duration-300 font-medium text-sm sm:text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
                aria-label="Add family member"
              >
                Add Family Member
              </button>
            </div>
          </div>
        )}

        {userData.role !== "family" && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Your Family Members</h2>
            {familyMembers.length === 0 ? (
              <p className="text-gray-600 text-sm sm:text-base">No family members added yet.</p>
            ) : (
              <div className="space-y-4">
                {familyMembers.map((member) => (
                  <div key={member.username} className="border border-gray-200 rounded-lg p-4 sm:p-6 bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="mt-1 text-sm sm:text-base text-gray-900">{member.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <p className="mt-1 text-sm sm:text-base text-gray-900">{member.username}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Relationship</label>
                        <p className="mt-1 text-sm sm:text-base text-gray-900">
                          {relationTypes.find((t) => t.value === member.relation)?.label || "Unknown"}
                        </p>
                      </div>
                      <div className="flex sm:justify-end">
                        <button
                          onClick={() => handleDeleteMember(member.username)}
                          className="mt-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 active:bg-red-800 transition-all duration-300 text-sm sm:text-base"
                          aria-label={`Delete family member ${member.username}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}