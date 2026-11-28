// src/Components/Utilities/blogs.js
// Travel Blog data: loaded from the backend (collection "blogs"). If the server is asleep, empty or unreachable,
// the few articles in data/travel.js are shown instead, so the page is never blank.
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import { articles as fallbackArticles } from "../../data/travel";

const monthYear = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "";

export const normalizeBlog = (b) => ({
  id: String(b._id || b.slug || b.title),
  title: b.title,
  category: b.category || "Travel Tips",
  date: b.date || monthYear(b.publishedAt || b.createdAt),
  read: b.read || `${b.readMinutes || 1} min`,
  image: b.image || "",
  excerpt: b.excerpt || "",
  body: Array.isArray(b.body) ? b.body : [],
  author: b.author || "Sababa Travel Desk",
  tags: b.tags || [],
  featured: !!b.featured,
});

const FALLBACK = fallbackArticles.map(normalizeBlog);

export const useBlogs = () => {
  const [state, setState] = useState({ blogs: [], loading: true, live: false });

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/blogs`);
        if (!res.ok) throw new Error("blogs");
        const list = await res.json();
        if (off) return;
        if (Array.isArray(list) && list.length) setState({ blogs: list.map(normalizeBlog), loading: false, live: true });
        else setState({ blogs: FALLBACK, loading: false, live: false });
      } catch {
        if (!off) setState({ blogs: FALLBACK, loading: false, live: false });
      }
    })();
    return () => {
      off = true;
    };
  }, []);

  return state;
};
