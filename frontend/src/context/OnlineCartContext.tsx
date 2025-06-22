"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface CartItem {
  item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (item_id: string) => void;
  clearCart: () => void;
  incrementQuantity: (item_id: string) => void;
  decrementQuantity: (item_id: string) => void;
  resetCartOnSignOut: () => void;
}

const OnlineCartContext = createContext<CartContextType | undefined>(undefined);

export const OnlineCartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState<number>(0);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("onlineCart");
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCart(parsedCart);
      setCartCount(parsedCart.reduce((total: number, item: CartItem) => total + item.quantity, 0));
    }
  }, []);

  // Save cart to localStorage and update cart count
  useEffect(() => {
    localStorage.setItem("onlineCart", JSON.stringify(cart));
    setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
  }, [cart]);

  const notifyCartChange = () => {
    window.dispatchEvent(new Event("onlineCartUpdated"));
  };

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.item_id === item.item_id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.item_id === item.item_id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
    notifyCartChange();
  };

  const removeFromCart = (item_id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.item_id !== item_id));
    notifyCartChange();
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("onlineCart");
    notifyCartChange();
  };

  const incrementQuantity = (item_id: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.item_id === item_id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
    notifyCartChange();
  };

  const decrementQuantity = (item_id: string) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.item_id === item_id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
    notifyCartChange();
  };

  const resetCartOnSignOut = () => {
    setCart([]);
    setCartCount(0);
    localStorage.removeItem("onlineCart");
    notifyCartChange();
  };

  return (
    <OnlineCartContext.Provider
      value={{
        cart,
        cartCount,
        addToCart,
        removeFromCart,
        clearCart,
        incrementQuantity,
        decrementQuantity,
        resetCartOnSignOut,
      }}
    >
      {children}
    </OnlineCartContext.Provider>
  );
};

export const useOnlineCart = () => {
  const context = useContext(OnlineCartContext);
  if (!context) {
    throw new Error("useOnlineCart must be used within a OnlineCartProvider");
  }
  return context;
};