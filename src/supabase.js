import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://lkjqnnjzxjyddtwobmrg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxranFubmp6eGp5ZGR0d29ibXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDQzMDEsImV4cCI6MjEwMjcyMDMwMX0.cA-f1ZCmtehW3Zo4psUpXrNMoK2sQRWhJfmngqpYLyk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== MENU =====
export async function getMenuFromDB() {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("id");
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
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("Orders fetch error:", error); return []; }
  return data;
}

export async function updateOrderStatusDB(orderId, status) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) console.error("Update order error:", error);
}

// ===== SEED MENU (one-time) =====
export async function seedMenu(items) {
  const { data: existing } = await supabase.from("menu_items").select("id").limit(1);
  if (existing && existing.length > 0) return; // Already seeded

  const rows = items.map(item => ({
    name: item.name,
    price: item.price,
    description: item.desc,
    image: item.image || "",
    veg: item.veg,
    category: item.category,
    available: true
  }));
  const { error } = await supabase.from("menu_items").insert(rows);
  if (error) console.error("Seed error:", error);
}
