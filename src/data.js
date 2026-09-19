import { getCartDB, saveCartDB, clearCartDB, getCategoriesDB } from "./supabase.js";

// ===== CURRENT USER =====
export function getCurrentUserEmail() {
  const user = JSON.parse(localStorage.getItem("alsheeri_user") || "{}");
  return user.email || "";
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem("alsheeri_user") || "{}");
}

export function setCurrentUser(user) {
  localStorage.setItem("alsheeri_user", JSON.stringify(user));
}

export function clearCurrentUser() {
  localStorage.removeItem("alsheeri_user");
}

// ===== CATEGORIES =====
let categoriesCache = null;

export async function getCategories() {
  if (categoriesCache) return categoriesCache;
  const dbCats = await getCategoriesDB();
  if (dbCats && dbCats.length > 0) {
    const allDbCat = dbCats.find(c => c.cat_id === "all");
    const otherCats = dbCats.filter(c => c.cat_id !== "all");
    categoriesCache = [
      { id: "all", name: "All", image: allDbCat?.image || "" },
      ...otherCats.map(c => ({ id: c.cat_id, name: c.name, image: c.image || "" }))
    ];
  } else {
    // Fallback defaults
    categoriesCache = [
      { id: "all", name: "All", image: "" },
      { id: "specials", name: "Basheer Bhai's Special", image: "/basheer-bhai.png" },
      { id: "starters", name: "Starters", image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=200&q=80" },
      { id: "rice", name: "Fried Rice", image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=200&q=80" },
      { id: "noodles", name: "Noodles", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&q=80" },
      { id: "biryani", name: "Biryani", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80" },
      { id: "soups", name: "Soups", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&q=80" },
      { id: "curries", name: "Curries", image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200&q=80" },
      { id: "breads", name: "Breads", image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=200&q=80" },
      { id: "tandoori", name: "Tandoori Cuisine", image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=200&q=80" },
      { id: "rolls", name: "Rolls", image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&q=80" },
      { id: "rayalaseema", name: "Rayalaseema Ruchulu", image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=200&q=80" },
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
    curries: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200&q=80",
    breads: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=200&q=80",
    tandoori: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=200&q=80",
    rolls: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&q=80",
    rayalaseema: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=200&q=80",
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
  if (!email) {
    // Guest: load cart from localStorage
    cartCache = JSON.parse(localStorage.getItem("alsheeri_guest_cart") || "[]");
    cartLoaded = true;
    return cartCache;
  }
  cartCache = await getCartDB(email);
  cartLoaded = true;
  return cartCache;
}

export function getCart() {
  return cartCache;
}

async function persistCart() {
  const email = getCurrentUserEmail();
  if (email) {
    await saveCartDB(email, cartCache);
  } else {
    localStorage.setItem("alsheeri_guest_cart", JSON.stringify(cartCache));
  }
}

export async function addToCart(item) {
  const existing = cartCache.find(i => i.id === item.id && (i.variantSize || "") === (item.variantSize || ""));
  if (existing) {
    existing.qty += 1;
  } else {
    cartCache.push({ ...item, qty: 1 });
  }
  await persistCart();
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
  await persistCart();
  return cartCache;
}

export async function clearCart() {
  cartCache = [];
  const email = getCurrentUserEmail();
  if (email) {
    await clearCartDB(email);
  } else {
    localStorage.removeItem("alsheeri_guest_cart");
  }
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
