import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "./AuthContext";

interface UserStats {
  pendingReviewsCount: number;
  activeOrdersCount: number;
  wishlistCount: number;
  refreshStats: () => void;
}

const UserStatsContext = createContext<UserStats>({
  pendingReviewsCount: 0,
  activeOrdersCount: 0,
  wishlistCount: 0,
  refreshStats: () => {},
});

export const useUserStats = () => useContext(UserStatsContext);

export const UserStatsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, token } = useAuth();
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setPendingReviewsCount(0);
      setActiveOrdersCount(0);
      setWishlistCount(0);
      return;
    }
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    let currentUser: { id: number; name: string } | null = null;
    try {
      const decoded: any = jwtDecode(token);
      currentUser = { id: decoded.id, name: decoded.sub };
    } catch {
      currentUser = null;
    }
    if (!currentUser) return;
    try {
      const [orderRes, pendingRes, processingRes, favRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/orders`, {
          params: { limit: 100, status: "delivered" },
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/orders`, {
          params: { limit: 100, status: "pending" },
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/orders`, {
          params: { limit: 100, status: "processing" },
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      // Pending reviews
      const deliveredOrders = orderRes.data.items || [];
      let reviewCount = 0;
      deliveredOrders.forEach((order: any) => {
        if (!order.order_details) return;
        order.order_details.forEach((detail: any) => {
          const product = detail.product;
          const alreadyReviewed = (product.reviews || []).some(
            (rev: any) =>
              rev.user_id === currentUser!.id && rev.order_id === order.order_id
          );
          if (!alreadyReviewed) {
            reviewCount++;
          }
        });
      });
      setPendingReviewsCount(reviewCount);
      // Active orders
      const pendingOrders = pendingRes.data.items || [];
      const processingOrders = processingRes.data.items || [];
      setActiveOrdersCount(pendingOrders.length + processingOrders.length);
      // Wishlist
      setWishlistCount(Array.isArray(favRes.data) ? favRes.data.length : 0);
    } catch {
      setPendingReviewsCount(0);
      setActiveOrdersCount(0);
      setWishlistCount(0);
    }
  }, [isAuthenticated, token]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <UserStatsContext.Provider
      value={{
        pendingReviewsCount,
        activeOrdersCount,
        wishlistCount,
        refreshStats: fetchStats,
      }}
    >
      {children}
    </UserStatsContext.Provider>
  );
};
