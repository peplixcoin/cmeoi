"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";

export const useAuth = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require auth
  const publicRoutes = ["/signin", "/reset-password"];

  useEffect(() => {
    const token = Cookies.get("token");
    const isPublic = publicRoutes.includes(pathname);

    if (!token && !isPublic) {
      router.push("/signin");
    }
  }, [router, pathname]);
};
