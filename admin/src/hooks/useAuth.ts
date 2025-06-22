"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export const useAuth = () => {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("adminToken");
    if (!token) {
      router.push("/login");
    }
  }, [router]);
};
