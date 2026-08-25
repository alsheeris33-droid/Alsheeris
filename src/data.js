// Al Sheeri's Menu — reads from admin-customized localStorage or falls back to default
const defaultMenu = [
  { id: 1, name: "Chicken Fried Rice", price: 120, desc: "Wok-tossed rice with chicken and vegetables", veg: false, category: "rice", image: "" },
  { id: 2, name: "Egg Fried Rice", price: 100, desc: "Fried rice with scrambled eggs and spring onions", veg: false, category: "rice", image: "" },
  { id: 3, name: "Veg Fried Rice", price: 90, desc: "Stir-fried rice with mixed vegetables", veg: true, category: "rice", image: "" },
  { id: 4, name: "Chicken Noodles", price: 120, desc: "Hakka noodles with chicken and veggies", veg: false, category: "noodles", image: "" },
  { id: 5, name: "Egg Noodles", price: 100, desc: "Stir-fried noodles with egg", veg: false, category: "noodles", image: "" },
  { id: 6, name: "Veg Noodles", price: 90, desc: "Hakka noodles with fresh vegetables", veg: true, category: "noodles", image: "" },
  { id: 7, name: "Chicken Manchurian", price: 150, desc: "Crispy chicken balls in spicy manchurian sauce", veg: false, category: "starters", image: "" },
  { id: 8, name: "Gobi Manchurian", price: 120, desc: "Cauliflower fritters in tangy sauce", veg: true, category: "starters", image: "" },
  { id: 9, name: "Chicken 65", price: 160, desc: "Spicy deep-fried chicken with curry leaves", veg: false, category: "starters", image: "" },
  { id: 10, name: "Paneer 65", price: 140, desc: "Crispy paneer cubes in spicy coating", veg: true, category: "starters", image: "" },
  { id: 11, name: "Dragon Chicken", price: 170, desc: "Spicy Indo-Chinese chicken with peppers", veg: false, category: "starters", image: "" },
  { id: 12, name: "Spring Rolls (Veg)", price: 100, desc: "Crispy rolls stuffed with vegetables", veg: true, category: "starters", image: "" },
  { id: 13, name: "Chicken Biryani", price: 180, desc: "Aromatic basmati rice with tender chicken", veg: false, category: "biryani", image: "" },
  { id: 14, name: "Egg Biryani", price: 140, desc: "Spiced rice with boiled eggs", veg: false, category: "biryani", image: "" },
  { id: 15, name: "Veg Biryani", price: 130, desc: "Fragrant rice with mixed vegetables", veg: true, category: "biryani", image: "" },
  { id: 16, name: "Chicken Manchow Soup", price: 80, desc: "Spicy chicken soup with crispy noodles", veg: false, category: "soups", image: "" },
  { id: 17, name: "Sweet Corn Soup", price: 70, desc: "Creamy sweet corn soup", veg: true, category: "soups", image: "" },
  { id: 18, name: "Hot & Sour Soup", price: 70, desc: "Tangy and spicy vegetable soup", veg: true, category: "soups", image: "" },
  { id: 19, name: "Basheer Bhai's Special Biryani", price: 220, desc: "Signature biryani with secret spice blend and slow-cooked meat", veg: false, category: "specials", image: "" },
  { id: 20, name: "Basheer Bhai's Butter Chicken", price: 200, desc: "Rich, creamy butter chicken made with Basheer Bhai's special recipe", veg: false, category: "specials", image: "" },
  { id: 21, name: "Basheer Bhai's Tandoori Platter", price: 280, desc: "Assorted tandoori items with special marinade and mint chutney", veg: false, category: "specials", image: "" },
  { id: 22, name: "Basheer Bhai's Paneer Special", price: 180, desc: "Paneer in a unique spicy gravy with secret masala", veg: true, category: "specials", image: "" },
];

// Get live menu (from Supabase or fallback to localStorage/default)
export function getMenu() {
  const custom = localStorage.getItem("alsheeri_menu_custom");
  return custom ? JSON.parse(custom) : defaultMenu;
}

export const menu = getMenu();

// Get default menu for seeding
export function getDefaultMenu() {
  return defaultMenu;
}

export function getCategories() {
  const customCats = localStorage.getItem("alsheeri_categories");
  const customNames = JSON.parse(localStorage.getItem("alsheeri_category_names") || "{}");
  const defaultCats = ["specials", "starters", "rice", "noodles", "biryani", "soups"];
  const catIds = customCats ? JSON.parse(customCats) : defaultCats;
  const defaultNames = { specials: "Basheer Bhai's Special", starters: "Starters", rice: "Fried Rice", noodles: "Noodles", biryani: "Biryani", soups: "Soups" };
  const allNames = { ...defaultNames, ...customNames };
  return [{ id: "all", name: "All" }, ...catIds.map(id => ({ id, name: allNames[id] || id }))];
}

export const categories = getCategories();

export function getCategoryImages() {
  const custom = JSON.parse(localStorage.getItem("alsheeri_category_images") || "{}");
  return {
    all: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80",
    specials: "/basheer-bhai.png",
    starters: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=200&q=80",
    rice: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=200&q=80",
    noodles: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&q=80",
    biryani: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80",
    soups: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&q=80",
    ...custom
  };
}

// Check item availability (set by admin)
export function isItemAvailable(itemId) {
  const avail = JSON.parse(localStorage.getItem("alsheeri_availability") || "{}");
  return avail[itemId] !== false;
}

// Cart functions
export function getCart() {
  return JSON.parse(localStorage.getItem("alsheeri_cart") || "[]");
}

export function saveCart(cart) {
  localStorage.setItem("alsheeri_cart", JSON.stringify(cart));
}

export function addToCart(item) {
  const cart = getCart();
  // For variant items, match by id + variantSize
  const existing = cart.find(i => i.id === item.id && (i.variantSize || "") === (item.variantSize || ""));
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(itemId, variantSize) {
  let cart = getCart();
  const idx = cart.findIndex(i => i.id === itemId && (i.variantSize || "") === (variantSize || ""));
  if (idx > -1) {
    if (cart[idx].qty > 1) {
      cart[idx].qty -= 1;
    } else {
      cart.splice(idx, 1);
    }
  }
  saveCart(cart);
  return cart;
}

export function clearCart() {
  localStorage.removeItem("alsheeri_cart");
}

// Orders functions
export function getOrders() {
  return JSON.parse(localStorage.getItem("alsheeri_orders") || "[]");
}

export function placeOrder(cart, userInfo) {
  const orders = getOrders();
  const order = {
    id: "ORD" + Date.now(),
    items: cart,
    user: userInfo,
    total: cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    status: "Placed",
    time: new Date().toISOString()
  };
  orders.push(order);
  localStorage.setItem("alsheeri_orders", JSON.stringify(orders));
  clearCart();
  return order;
}

export function updateOrderStatus(orderId, status) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
    localStorage.setItem("alsheeri_orders", JSON.stringify(orders));
  }
  return orders;
}
