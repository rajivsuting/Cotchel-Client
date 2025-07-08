import { useState, useEffect } from "react";
import api from "../services/apiService";
import { API } from "../config/api";

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await api.get(API.CATEGORIES.ALL);
        if (response.data.success && Array.isArray(response.data.data)) {
          // Ensure each category has a subCategories array
          const formattedCategories = response.data.data.map((category) => ({
            ...category,
            subCategories: category.subCategories || [],
          }));
          setCategories(formattedCategories);
        } else {
          setCategories([]);
          setError(response.data.message || "Failed to fetch categories");
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err.response?.data?.message || "Failed to fetch categories");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};
