import { getCartDB, saveCartDB, clearCartDB, getCategoriesDB } from "./supabase.js";

// ===== CURRENT USER =====
export function getCurrentUserEmail() {
  const user = JSON.parse(sessionStorage.getItem("alsheeri_user") || "{}");
  return user.email || "";
}

export function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem("alsheeri_user") || "{}");
}

export function setCurrentUser(user) {
  sessionStorage.setItem("alsheeri_user", JSON.stringify(user));
}

export function clearCurrentUser() {
  sessionStorage.removeItem("alsheeri_user");
}

// ===== CATEGORIES =====
let categoriesCache = null;

export async function getCategories() {
  if (categoriesCache) return categoriesCache;
  const dbCats = await getCategoriesDB();
  if (dbCats && dbCats.length > 0) {
    categoriesCache = [{ id: "all", name: "All", image: "" }, ...dbCats.map(c => ({ id: c.cat_id, name: c.name, image: c.image || "" }))];
  } else {
    // Fallback defaults
    categoriesCache = [
      { id: "all", name: "All", image: "" },
      { id: "specials", name: "Basheer Bhai's Special", image: "/basheer-bhai.png" },
      { id: "starters", name: "Starters", image: "" },
      { id: "rice", name: "Fried Rice", image: "" },
      { id: "noodles", name: "Noodles", image: "" },
      { id: "biryani", name: "Biryani", image: "" },
      { id: "soups", name: "Soups", image: "" },
    ];
  }
  return categoriesCache;
}

export function getCategoryImages() {
  if (!categoriesCache) return {};
  const images = {};
  categoriesCache.forEach(c => { if (c.image) images[c.id] = c.image; });
  return {
    all: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80",
    specials: "/basheer-bhai.png",
    starters: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=200&q=80",
    rice: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=200&q=80",
    noodles: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&q=80",
    biryani: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80",
    soups: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&q=80",
    ...images
  };
}

export function invalidateCategoriesCache() {
  categoriesCache = null;
}

// ===== CART (Supabase-backed) =====
let cartCache = [];
let cartLoaded = false;

export async function loadCart() {
  const email = getCurrentUserEmail();
  if (!email) { cartCache = []; cartLoaded = true; return []; }
  cartCache = await getCartDB(email);
  cartLoaded = true;
  return cartCache;
}

export function getCart() {
  return cartCache;
}

export async function addToCart(item) {
  const existing = cartCache.find(i => i.id === item.id && (i.variantSize || "") === (item.variantSize || ""));
  if (existing) {
    existing.qty += 1;
  } else {
    cartCache.push({ ...item, qty: 1 });
  }
  // Save to Supabase
  const email = getCurrentUserEmail();
  if (email) await saveCartDB(email, cartCache);
  return cartCache;
}

export async function removeFromCart(itemId, variantSize) {
  const idx = cartCache.findIndex(i => i.id === itemId && (i.variantSize || "") === (variantSize || ""));
  if (idx > -1) {
    if (cartCache[idx].qty > 1) {
      cartCache[idx].qty -= 1;
    } else {
      cartCache.splice(idx, 1);
    }
  }
  const email = getCurrentUserEmail();
  if (email) await saveCartDB(email, cartCache);
  return cartCache;
}

export async function clearCart() {
  cartCache = [];
  const email = getCurrentUserEmail();
  if (email) await clearCartDB(email);
}

// ===== MENU (kept for compatibility) =====
export function getMenu() {
  return [];
}

export function getDefaultMenu() {
  return [];
}

export const menu = [];

export function isItemAvailable(itemId) {
  return true;
}
