import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://lkjqnnjzxjyddtwobmrg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxranFubmp6eGp5ZGR0d29ibXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDQzMDEsImV4cCI6MjEwMjcyMDMwMX0.cA-f1ZCmtehW3Zo4psUpXrNMoK2sQRWhJfmngqpYLyk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== MENU =====
export async function getMenuFromDB() {
  const { data, error } = await supabase.from("menu_items").select("*").order("id");
  if (error) { console.error("Menu fetch error:", error); return []; }
  return data;
}

export async function addMenuItemDB(item) {
  const { data, error } = await supabase.from("menu_items").insert([item]).select();
  if (error) { console.error("Add item error:", error); return null; }
  return data[0];
}

export async function updateMenuItemDB(id, updates) {
  const { error } = await supabase.from("menu_items").update(updates).eq("id", id);
  if (error) console.error("Update item error:", error);
}

export async function deleteMenuItemDB(id) {
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) console.error("Delete item error:", error);
}

export async function toggleAvailabilityDB(id, available) {
  const { error } = await supabase.from("menu_items").update({ available }).eq("id", id);
  if (error) console.error("Toggle error:", error);
}

// ===== ORDERS =====
export async function placeOrderDB(order) {
  const { data, error } = await supabase.from("orders").insert([order]).select();
  if (error) { console.error("Place order error:", error); return null; }
  return data[0];
}

export async function getOrdersDB() {
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) { console.error("Orders fetch error:", error); return []; }
  return data;
}

export async function getOrdersByEmailDB(email) {
  const { data, error } = await supabase.from("orders").select("*").contains("user_info", { email }).order("created_at", { ascending: false });
  if (error) { console.error("Orders fetch error:", error); return []; }
  return data;
}

export async function updateOrderStatusDB(orderId, status) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) console.error("Update order error:", error);
}

// ===== CART =====
export async function getCartDB(userEmail) {
  if (!userEmail) return [];
  const { data, error } = await supabase.from("cart").select("items").eq("user_email", userEmail).maybeSingle();
  if (error || !data) return [];
  return data.items || [];
}

export async function saveCartDB(userEmail, items) {
  if (!userEmail) return;
  const { data: existing } = await supabase.from("cart").select("id").eq("user_email", userEmail).maybeSingle();
  if (existing) {
    await supabase.from("cart").update({ items, updated_at: new Date().toISOString() }).eq("user_email", userEmail);
  } else {
    await supabase.from("cart").insert([{ user_email: userEmail, items }]);
  }
}

export async function clearCartDB(userEmail) {
  if (!userEmail) return;
  await supabase.from("cart").update({ items: [], updated_at: new Date().toISOString() }).eq("user_email", userEmail);
}

// ===== USER PROFILES =====
export async function getUserProfile(email) {
  if (!email) return null;
  const { data, error } = await supabase.from("user_profiles").select("*").eq("email", email).maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function saveUserProfile(profile) {
  const { data: existing } = await supabase.from("user_profiles").select("id").eq("email", profile.email).maybeSingle();
  if (existing) {
    await supabase.from("user_profiles").update({
      name: profile.name, phone: profile.phone, address: profile.address, lat: profile.lat, lng: profile.lng
    }).eq("email", profile.email);
  } else {
    await supabase.from("user_profiles").insert([profile]);
  }
}

// ===== CATEGORIES =====
export async function getCategoriesDB() {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error || !data) return [];
  return data;
}

export async function saveCategoryDB(catId, name, image, sortOrder) {
  const { data: existing } = await supabase.from("categories").select("id").eq("cat_id", catId).maybeSingle();
  if (existing) {
    await supabase.from("categories").update({ name, image, sort_order: sortOrder }).eq("cat_id", catId);
  } else {
    await supabase.from("categories").insert([{ cat_id: catId, name, image, sort_order: sortOrder }]);
  }
}

export async function deleteCategoryDB(catId) {
  await supabase.from("categories").delete().eq("cat_id", catId);
}

export async function saveCategoryImagesDB(images) {
  // images is an object like { starters: "url", rice: "url" }
  for (const [catId, imageUrl] of Object.entries(images)) {
    await supabase.from("categories").update({ image: imageUrl }).eq("cat_id", catId);
  }
}
