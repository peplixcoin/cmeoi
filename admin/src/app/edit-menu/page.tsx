// app/manager/page.tsx - manager page
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface MenuItem {
  item_id: string;
  item_name: string;
  item_cty: string; // Main Category
  item_subcty: string; // Sub Category
  item_price: number;
  availability: boolean;
  item_img: string;
  isveg: boolean;
}

export default function ManagerMenuPage() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Check manager token and fetch categories on mount
  useEffect(() => {
    const token = Cookies.get("adminToken");
    const role = Cookies.get("adminRole");
    
    if (!token) {
      router.push("/login");
    } else if (role !== "Manager") {
      // Redirect to default page based on role
      if (role === "SuperAdmin") {
        router.push("/");
      } else if (role === "Cook") {
        router.push("/cook");
      } else {
        router.push("/login");
      }
    } else {
      fetchCategories();
    }
  }, [router]);

  // Close sidebar when clicking outside (mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle scroll event for mobile
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 768) {
        setScrolled(window.scrollY > 50);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch categories from the server
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/menu/categories`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategory(data[0]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const fetchSubCategories = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/menu/subcategories?category=${selectedCategory}`
          );
          if (!response.ok) throw new Error("Failed to fetch subcategories");
          const data = await response.json();
          setSubCategories(data);
          setSelectedSubCategory(data.length > 0 ? data[0] : null);
        } catch (error) {
          console.error("Error fetching subcategories:", error);
        }
      };
      fetchSubCategories();
    }
  }, [selectedCategory]);

  // Fetch menu items when selectedCategory or selectedSubCategory changes
  const fetchMenuItems = async () => {
    if (!selectedCategory || !selectedSubCategory) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/menu/items?category=${selectedCategory}&subcategory=${selectedSubCategory}`
      );
      if (!response.ok) throw new Error("Failed to fetch menu items");
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, [selectedCategory, selectedSubCategory]);

  // Toggle item availability
  const toggleAvailability = async (itemId: string, currentAvailability: boolean) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/menu/${itemId}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: !currentAvailability }),
      });
      if (!response.ok) throw new Error("Failed to update availability");
      await fetchMenuItems();
    } catch (error) {
      console.error("Error updating availability:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file input change for editing
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Set item for editing
  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
  };

  // Update an existing menu item
  const updateMenuItem = async () => {
    if (!editingItem) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("item_name", editingItem.item_name);
      formData.append("item_cty", editingItem.item_cty);
      formData.append("item_subcty", editingItem.item_subcty);
      formData.append("item_price", String(editingItem.item_price));
      formData.append("availability", String(editingItem.availability));
      formData.append("isveg", String(editingItem.isveg));
      if (selectedFile) {
        formData.append("item_img", selectedFile);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/menu/${editingItem.item_id}`, {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to update menu item");

      setEditingItem(null);
      setSelectedFile(null);
      await fetchMenuItems();
    } catch (error) {
      console.error("Error updating menu item:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen pt-4">
      {/* Hamburger Menu for Mobile */}
      {!isSidebarOpen && (
        <button
          className={`fixed z-40 p-3 bg-gray-600 text-white rounded-full shadow-lg transition-all duration-300 md:hidden ${
            scrolled ? "bottom-5 left-5" : "top-[5.7rem] left-3"
          }`}
          onClick={() => setIsSidebarOpen(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      )}

      {/* Sidebar: Category Menu */}
      <div
        ref={sidebarRef}
        className={`fixed pt-14 inset-y-0 left-0 w-64 bg-white shadow-lg transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-64 z-40 overflow-y-auto max-h-screen`}
      >
        <div className="p-4">
          <h2 className="text-2xl font-semibold mb-4">Categories</h2>
          {categories.length > 0 ? (
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category}>
                  <button
                    className={`w-full text-left px-4 py-2 rounded-md ${
                      selectedCategory === category
                        ? "bg-gray-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsSidebarOpen(false);
                    }}
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No categories available</p>
          )}
        </div>
      </div>

      {/* Main Content: Menu Items */}
      <div className="flex-1 p-4 md:ml-10">
        <h2 className="text-2xl font-semibold mb-2 ml-12 md:hidden">
          {selectedCategory || "Categories"}
        </h2>

        {/* Sub-Category Filter */}
        {subCategories.length > 0 && (
          <div className="sticky top-20 z-30 bg-red-100 py-2 shadow-sm mb-3 rounded-xl">
            <div className="px-4">
              <div className="flex flex-wrap gap-2">
                {subCategories.map((subCategory) => (
                  <button
                    key={subCategory}
                    onClick={() => setSelectedSubCategory(subCategory)}
                    className={`whitespace-nowrap px-4 py-1 rounded-full ${
                      selectedSubCategory === subCategory
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {subCategory}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-xl font-semibold mb-4">Edit Item</h2>
              <input
                type="text"
                placeholder="Item Name"
                className="border p-2 rounded w-full mb-2 bg-gray-100"
                value={editingItem.item_name}
                readOnly
              />
              <input
                type="file"
                accept="image/*"
                className="border p-2 rounded w-full mb-2"
                onChange={handleFileChange}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateMenuItem}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <div
                key={item.item_id}
                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow relative"
              >
                <button
                  onClick={() => handleEditItem(item)}
                  className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors z-20"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
                <div className="relative">
                  <img
                    src={item.item_img}
                    alt={item.item_name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                    loading="lazy"
                  />
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full ${
                      item.isveg
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.isveg ? "Veg" : "Non-Veg"}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-sm">{item.item_name}</h3>
                <p className="text-gray-900 font-bold  text-sm">₹{item.item_price}</p>
                <p className="text-sm text-gray-500 text-sm">{item.item_subcty}</p>
                <p
                  className={`text-xs mb-1 ${
                    item.availability ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {item.availability ? "Available" : "Out of Stock"}
                </p>
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => toggleAvailability(item.item_id, item.availability)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors text-xs"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Toggle Availability"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No menu items available.</p>
          )}
        </div>
      </div>
    </div>
  );
}