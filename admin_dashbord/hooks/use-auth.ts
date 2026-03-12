"use client";
import { useEffect, useState } from "react";

export const useAuth = () => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage (backend auth)
    const token = localStorage.getItem("token");
    const isAuthenticated = !!token;

    if (isAuthenticated) {
      setUser({ isAuthenticated: true });
    }

    setLoading(false);
  }, []);

  return { user, loading, isAuthenticated: !!user?.isAuthenticated };
};
