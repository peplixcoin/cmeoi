"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

interface Instruction {
  _id: string;
  instruction: string;
  createdAt: string;
}

export default function InstructionPage() {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [newInstruction, setNewInstruction] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check authentication and role
  useEffect(() => {
    const token = Cookies.get("adminToken");
    const role = Cookies.get("adminRole");
    if (!token || (role !== "SuperAdmin")) {
      router.push("/login");
    }
  }, [router]);

  // Fetch all instructions
  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        const token = Cookies.get("adminToken");
        const response = await fetch("${process.env.NEXT_PUBLIC_API_URL}/api/instructions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch instructions");
        const data = await response.json();
        setInstructions(data);
        setError(null);
      } catch (err) {
        setError("Failed to load instructions. Please try again.");
      }
    };
    fetchInstructions();
  }, []);

  // Add new instruction
  const handleAddInstruction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstruction.trim()) {
      setError("Instruction text cannot be empty");
      return;
    }
    try {
      const token = Cookies.get("adminToken");
      const response = await fetch("${process.env.NEXT_PUBLIC_API_URL}/api/instructions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ instruction: newInstruction }),
      });
      if (!response.ok) throw new Error("Failed to add instruction");
      const addedInstruction = await response.json();
      setInstructions([addedInstruction, ...instructions]);
      setNewInstruction("");
      setError(null);
    } catch (err) {
      setError("Failed to add instruction. Please try again.");
    }
  };

  // Start editing an instruction
  const handleEditInstruction = (instruction: Instruction) => {
    setEditingId(instruction._id);
    setEditingText(instruction.instruction);
  };

  // Save edited instruction
  const handleSaveEdit = async (id: string) => {
    if (!editingText.trim()) {
      setError("Instruction text cannot be empty");
      return;
    }
    try {
      const token = Cookies.get("adminToken");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/instructions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ instruction: editingText }),
      });
      if (!response.ok) throw new Error("Failed to update instruction");
      const updatedInstruction = await response.json();
      setInstructions(
        instructions.map((inst) =>
          inst._id === id ? updatedInstruction : inst
        )
      );
      setEditingId(null);
      setEditingText("");
      setError(null);
    } catch (err) {
      setError("Failed to update instruction. Please try again.");
    }
  };

  // Delete instruction
  const handleDeleteInstruction = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this instruction?")) return;
    try {
      const token = Cookies.get("adminToken");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/instructions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete instruction");
      setInstructions(instructions.filter((inst) => inst._id !== id));
      setError(null);
    } catch (err) {
      setError("Failed to delete instruction. Please try again.");
    }
  };

  return (
    <div className="min-h-screen p-4 max-w-5xl mx-auto">
      
     <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl px-6 py-2 mb-4 shadow-lg">
            <h1 className="text-base text-center font-bold text-white ">Manage Announcements</h1>
          </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-center mb-4">{error}</p>
      )}

      {/* Add Instruction Form */}
      <form onSubmit={handleAddInstruction} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={newInstruction}
            onChange={(e) => setNewInstruction(e.target.value)}
            placeholder="Enter new instruction"
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Announcement
          </button>
        </div>
      </form>

      {/* Instructions List */}
      <div className="bg-white rounded-lg shadow-md p-4">
        {instructions.length > 0 ? (
          <ul className="space-y-4">
            {instructions.map((instruction) => (
              <li
                key={instruction._id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-2"
              >
                {editingId === instruction._id ? (
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(instruction._id)}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <p className="text-gray-700">{instruction.instruction}</p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(instruction.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {editingId !== instruction._id && (
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => handleEditInstruction(instruction)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteInstruction(instruction._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">No instructions found</p>
        )}
      </div>
    </div>
  );
}