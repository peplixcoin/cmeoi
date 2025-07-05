"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useDineCart } from "@/context/DineCartContext";
import Image from 'next/image';

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

export default function DineMenuPage() {
  const router = useRouter();
  const { cart, addToCart, incrementQuantity, decrementQuantity } =
    useDineCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [foodType, setFoodType] = useState<"all" | "veg" | "nonveg">("all");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Check authentication and fetch categories on mount
  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/signin");
    } else {
      fetchCategories();
    }
  }, [router]);

  // Close sidebar on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
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
        // Only for mobile
        setScrolled(window.scrollY > 50);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchWithRetry = async (
    url: string,
    options: RequestInit = {},
    retries = 3,
    delay = 1000
  ): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return response;
    } catch (error) {
      if (retries <= 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2); // Exponential backoff
    }
  };

  // Fetch categories from the server
  const fetchCategories = async () => {
    try {
      const response = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_URL}/api/menu/categories`
      );
      const data = await response.json();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategory(data[0]);
      }
    } catch (error) {
      console.error("Error fetching categories after retries:", error);
      // You might want to show an error message to the user here
    }
  };

  // Fetch menu items when selectedCategory changes
  useEffect(() => {
    if (selectedCategory) {
      const fetchSubCategories = async () => {
        try {
          const response = await fetchWithRetry(
            `${process.env.NEXT_PUBLIC_API_URL}/api/menu/subcategories?category=${selectedCategory}`
          );
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

  useEffect(() => {
    if (selectedCategory && selectedSubCategory) {
      const fetchMenuItems = async () => {
        try {
          const response = await fetchWithRetry(
            `${process.env.NEXT_PUBLIC_API_URL}/api/menu/items?category=${selectedCategory}&subcategory=${selectedSubCategory}`
          );
          const data: MenuItem[] = await response.json();
          setMenuItems(data);
        } catch (error) {
          console.error("Error fetching menu items:", error);
        }
      };
      fetchMenuItems();
    }
  }, [selectedCategory, selectedSubCategory]);

  // Filter items based on foodType and sub-category selection
  useEffect(() => {
    let filtered = [...menuItems];
    if (foodType === "veg") {
      filtered = filtered.filter((item) => item.isveg);
    } else if (foodType === "nonveg") {
      filtered = filtered.filter((item) => !item.isveg);
    }
   filtered = filtered.sort((a, b) => a.item_name.localeCompare(b.item_name));
  setFilteredItems(filtered);
  }, [foodType, menuItems]);

  return (
    <div className="flex min-h-screen mt-1 pb-[70px]">
      {/* Hamburger Menu Button - Modified for mobile scrolling */}
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

      {/* Food Type Filter - Fixed on bottom right when scrolled on mobile */}
      <div
        className={`fixed z-40 md:hidden ${
          scrolled
            ? "bottom-5 right-5" // Moves to bottom right when scrolled
            : "top-[5.5rem] right-2" // Original position at top right
        }`}
      >
        <div className="bg-white bg-opacity-90 backdrop-blur-sm p-1 rounded-full shadow-xl border border-pink-200">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setFoodType("all")}
              className={`p-2 rounded-full transition-all ${
                foodType === "all"
                  ? "bg-purple-200 text-purple-800 shadow-inner"
                  : "bg-gray-100 text-gray-700"
              }`}
              aria-label="All items"
            >
              <span className="text-xs font-medium">All</span>
            </button>
            <button
              onClick={() => setFoodType("veg")}
              className={`p-2 rounded-full transition-all ${
                foodType === "veg"
                  ? "bg-green-200 text-green-800 shadow-inner"
                  : "bg-gray-100 text-gray-700"
              }`}
              aria-label="Vegetarian"
            >
              <span className="text-xs font-medium">Veg</span>
            </button>
            <button
              onClick={() => setFoodType("nonveg")}
              className={`p-2 rounded-full transition-all ${
                foodType === "nonveg"
                  ? "bg-red-200 text-red-800 shadow-inner"
                  : "bg-gray-100 text-gray-700"
              }`}
              aria-label="Non-vegetarian"
            >
              <span className="text-xs font-medium">Non</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed pt-14 inset-y-0 left-0 w-42 bg-white shadow-lg transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-64 z-40 overflow-y-auto max-h-screen`}
      >
        <div className="p-4">
           <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl px-6 py-2 mb-4 mt-2 shadow-lg">
            <h1 className="text-base text-center font-bold text-white ">Category</h1>
          </div>
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
        </div>
      </div>

      {/* Menu Items Section */}
      <div className="flex-1 p-4 md:ml-10">
        <h2 className="text-lg md:text-xl font-semibold mb-6 ml-14 md:hidden">
          {selectedCategory || "Categories"}
        </h2>

        {/* Food Type Filter - Desktop */}
        <div className="hidden md:flex items-center space-x-4 mb-2 ml-12">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="foodType"
              checked={foodType === "all"}
              onChange={() => setFoodType("all")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">All</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="foodType"
              checked={foodType === "veg"}
              onChange={() => setFoodType("veg")}
              className="h-4 w-4 text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-700">Veg</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="foodType"
              checked={foodType === "nonveg"}
              onChange={() => setFoodType("nonveg")}
              className="h-4 w-4 text-red-600 focus:ring-red-500"
            />
            <span className="text-gray-700">Non-Veg</span>
          </label>
        </div>

        {/* Sub-Category Filter - Fixed Position */}
        {subCategories.length > 0 && (
          <div className="sticky top-20 z-30 bg-red-100 py-2 shadow-sm mb-1 rounded-xl">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:mt-8 gap-6 pt-4 md:pt-0">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const cartItem = cart.find((ci) => ci.item_id === item.item_id);
              const quantity = cartItem ? cartItem.quantity : 0;

              return (
                <div
                  key={item.item_id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow md:p-4"
                >
                  {/* Mobile Layout - Horizontal Card */}
                  <div className="md:hidden flex p-2 items-center">
                    <div className="flex-1 pr-2">
                      <h3 className="text-sm font-semibold">
                        {item.item_name}
                      </h3>
                      <p className="text-gray-900 font-bold mt-1">
                        ₹{item.item_price}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.item_subcty}
                      </p>
                      <p
                        className={`text-xs mb-2 ${
                          item.availability ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {item.availability ? "Available" : "Unavailable Today"}
                      </p>
                      {item.availability && (
                        <div className="flex items-center space-x-2">
                          {quantity > 0 && (
                            <button
                              onClick={() => decrementQuantity(item.item_id)}
                              className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 transition-colors text-sm"
                            >
                              -
                            </button>
                          )}
                          <button
                            onClick={() =>
                              quantity === 0
                                ? addToCart({
                                    item_id: item.item_id,
                                    item_name: item.item_name,
                                    item_price: item.item_price,
                                    quantity: 1,
                                  })
                                : incrementQuantity(item.item_id)
                            }
                            className={`${
                              quantity > 0 ? "bg-blue-500" : "bg-blue-500"
                            } text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors text-sm`}
                          >
                            {quantity > 0 ? (
                              <span>{quantity}</span>
                            ) : (
                              <span>Add</span>
                            )}
                          </button>
                          {quantity > 0 && (
                            <button
                              onClick={() => incrementQuantity(item.item_id)}
                              className="bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600 transition-colors text-sm"
                            >
                              +
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="w-[160px] h-[120px] flex-shrink-0 relative flex items-center justify-center overflow-hidden rounded-lg">
                      <Image
                        src={item.item_img}
                        alt={item.item_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span
                        className={`absolute top-0.5 right-0.5 px-2 py-1 text-xs rounded-full ${
                          item.isveg
                            ? "bg-green-100/70 text-green-800"
                            : "bg-red-100/70 text-red-800"
                        }`}
                      >
                        {item.isveg ? "Veg" : "NonV"}
                      </span>
                    </div>
                  </div>

                  {/* Desktop Layout - Vertical Card */}
                  <div className="hidden md:block">
                    <div className="relative">
                      <Image
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
                    <h3 className="text-lg font-semibold">{item.item_name}</h3>
                    <p className="text-gray-900 font-bold">
                      ₹{item.item_price}
                    </p>
                    <p className="text-sm text-gray-500">{item.item_subcty}</p>
                    <p
                      className={`text-sm mb-1 ${
                        item.availability ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {item.availability ? "Available" : "Unavailable Today"}
                    </p>
                    {item.availability && (
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() =>
                            quantity === 0
                              ? addToCart({
                                  item_id: item.item_id,
                                  item_name: item.item_name,
                                  item_price: item.item_price,
                                  quantity: 1,
                                })
                              : incrementQuantity(item.item_id)
                          }
                          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                        >
                          +
                        </button>
                        <span className="text-lg font-semibold">
                          {quantity}
                        </span>
                        {quantity > 0 && (
                          <button
                            onClick={() => decrementQuantity(item.item_id)}
                            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                          >
                            -
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">No menu items available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
