import "./style.css";
import { getCart, addToCart, removeFromCart, clearCart, loadCart, getCategories, getCategoryImages, getCurrentUser, getCurrentUserEmail, setCurrentUser, clearCurrentUser } from "./data.js";
import { getMenuFromDB, placeOrderDB, getUserProfile } from "./supabase.js";

// Note: No forced login. Users can browse freely. Login is required only when placing an order.

// ===== INIT =====
let supabaseMenu = null;
let activeCategory = "all";
let vegFilter = "all";

const tabsContainer = document.getElementById("category-tabs");
const searchInput = document.getElementById("search-input");

// Load everything async
async function init() {
  checkAuth();
  showStoreStatus();
  // Show loading state
  const menuList = document.getElementById("menu-list");
  menuList.innerHTML = '<p class="col-span-full text-center text-gray-400 py-12">Loading menu...</p>';
  try { await loadCart(); } catch (e) { console.log("Cart load failed:", e); }
  // Load categories FIRST so category images/names are ready
  const cats = await getCategories();
  renderTabs(cats);
  // Then load menu and render
  await loadSupabaseMenu();
  // Guaranteed re-render after everything settles
  setTimeout(() => renderMenu(), 100);
  // Poll for updates
  setInterval(loadSupabaseMenu, 10000);
}
// init() called at the bottom of file after all functions are defined

// ===== AUTH =====
const authSection = document.getElementById("auth-section");
const authText = document.getElementById("auth-text");
const profileDropdown = document.getElementById("profile-dropdown");
const signOutBtn = document.getElementById("sign-out-btn");

function checkAuth() {
  const user = getCurrentUser();
  if (user.loggedIn) {
    authText.innerHTML = '<svg class="w-6 h-6 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M5 21v-1a7 7 0 0114 0v1"/></svg>';
    document.getElementById("profile-name").textContent = user.name || "User";
    document.getElementById("profile-phone").textContent = user.email || "";
    authSection.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("hidden");
    });
    signOutBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clearCurrentUser();
      window.location.reload();
    });
    document.addEventListener("click", () => profileDropdown.classList.add("hidden"));
  } else {
    authText.textContent = "Sign In";
    authSection.addEventListener("click", () => { window.location.href = "/login.html"; });
  }
}

// ===== CATEGORY TABS =====
function renderTabs(categories) {
  tabsContainer.innerHTML = "";
  const images = getCategoryImages();
  categories.forEach(cat => {
    const isActive = activeCategory === cat.id;
    const btn = document.createElement("button");
    btn.className = "flex flex-col items-center shrink-0 group";
    btn.innerHTML = `
      <div class="w-20 h-20 rounded-full overflow-hidden mb-1.5 ring-2 ${isActive ? "ring-orange-500" : "ring-transparent"} group-hover:ring-orange-400 transition-all">
        <img src="${cat.image || images[cat.id] || images.all}" alt="${cat.name}" class="w-full h-full object-cover"/>
      </div>
      <span class="text-xs font-medium ${isActive ? "text-orange-600" : "text-gray-700"}">${cat.name}</span>
    `;
    btn.addEventListener("click", async () => {
      activeCategory = cat.id;
      const cats = await getCategories();
      renderTabs(cats);
      renderMenu();
    });
    tabsContainer.appendChild(btn);
  });
}

// ===== SEARCH =====
searchInput.addEventListener("input", renderMenu);

// ===== VEG FILTER =====
document.getElementById("veg-filter").addEventListener("click", (e) => {
  const btn = e.target.closest(".veg-btn");
  if (!btn) return;
  vegFilter = btn.dataset.filter;
  document.querySelectorAll(".veg-btn").forEach(b => {
    if (b.dataset.filter === vegFilter) {
      b.className = "veg-btn flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gray-900 text-white border border-gray-900";
    } else if (b.dataset.filter === "specials") {
      b.className = "veg-btn flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-orange-400 text-orange-600 hover:bg-orange-50";
    } else {
      b.className = "veg-btn flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50";
    }
  });
  renderMenu();
});

// ===== MENU =====
function renderMenu() {
  const cart = getCart();
  const currentMenu = supabaseMenu || [];
  const searchTerm = searchInput.value.toLowerCase();
  const menuList = document.getElementById("menu-list");
  menuList.innerHTML = "";

  // If menu not loaded yet, show loading
  if (supabaseMenu === null) {
    menuList.innerHTML = '<p class="col-span-full text-center text-gray-400 py-12">Loading menu...</p>';
    return;
  }

  const filtered = currentMenu.filter(item => {
    const matchCat = activeCategory === "all" || item.category === activeCategory;
    const matchSearch = (item.name || "").toLowerCase().includes(searchTerm);
    const matchVeg = vegFilter === "all" || (vegFilter === "veg" && item.veg) || (vegFilter === "nonveg" && !item.veg) || (vegFilter === "specials" && item.category === "specials");
    return matchCat && matchSearch && matchVeg;
  });

  if (filtered.length === 0) {
    menuList.innerHTML = '<p class="col-span-full text-center text-gray-500 py-12">No items found</p>';
    updateCartUI(cart);
    return;
  }

  filtered.forEach(item => {
   try {
    const hasVariants = Array.isArray(item.variants) && item.variants.length > 0;
    const available = item.available !== false;

    let totalQtyInCart = 0;
    if (hasVariants) {
      item.variants.forEach(v => {
        const ci = cart.find(c => c.id === item.id && c.variantSize === v.size);
        if (ci) totalQtyInCart += ci.qty;
      });
    } else {
      const cartItem = cart.find(c => c.id === item.id && !c.variantSize);
      totalQtyInCart = cartItem ? cartItem.qty : 0;
    }
    const qty = totalQtyInCart;

    const displayPrice = hasVariants ? `₹${Math.min(...item.variants.map(v => v.price))}` : `₹${item.price}`;

    let buttonHtml = "";
    if (!available) {
      buttonHtml = `<span class="text-xs font-medium text-red-500 px-2 py-1 bg-red-50 rounded">Unavailable</span>`;
    } else if (hasVariants) {
      if (qty === 0) {
        buttonHtml = `<button class="add-variant-trigger border-2 border-green-600 text-green-600 font-bold px-4 py-1 rounded-lg text-xs hover:bg-green-50 transition-colors" data-id="${item.id}">ADD</button>`;
      } else {
        buttonHtml = `<div class="flex items-center gap-2 border-2 border-green-600 rounded-lg px-2 py-0.5">
          <button class="minus-variant-trigger text-green-600 font-bold text-base" data-id="${item.id}">−</button>
          <span class="font-bold text-xs w-4 text-center">${qty}</span>
          <button class="add-variant-trigger text-green-600 font-bold text-base" data-id="${item.id}">+</button>
        </div>`;
      }
    } else {
      if (qty === 0) {
        buttonHtml = `<button class="add-btn border-2 border-green-600 text-green-600 font-bold px-4 py-1 rounded-lg text-xs hover:bg-green-50 transition-colors" data-id="${item.id}">ADD</button>`;
      } else {
        buttonHtml = `<div class="flex items-center gap-2 border-2 border-green-600 rounded-lg px-2 py-0.5">
          <button class="minus-btn text-green-600 font-bold text-base" data-id="${item.id}">−</button>
          <span class="font-bold text-xs w-4 text-center">${qty}</span>
          <button class="plus-btn text-green-600 font-bold text-base" data-id="${item.id}">+</button>
        </div>`;
      }
    }

    const div = document.createElement("div");
    div.className = `bg-white rounded-2xl border border-gray-100 p-4 shadow-sm ${available ? "hover:shadow-md" : "opacity-50"} transition-shadow`;
    div.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="w-3.5 h-3.5 border-2 ${item.veg ? "border-green-600" : "border-red-600"} rounded-sm flex items-center justify-center shrink-0">
              <span class="w-1.5 h-1.5 ${item.veg ? "bg-green-600" : "bg-red-600"} rounded-full"></span>
            </span>
            <h3 class="font-semibold text-sm truncate">${item.name}</h3>
          </div>
          <p class="font-bold text-sm">${displayPrice}</p>
          <p class="text-xs text-gray-500 mt-1 line-clamp-2">${item.desc}</p>
        </div>
        <div class="shrink-0 flex flex-col items-center gap-2">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded-lg"/>` : ""}
          ${buttonHtml}
        </div>
      </div>
    `;
    menuList.appendChild(div);
   } catch (err) {
    console.error("Error rendering item:", item, err);
   }
  });

  // Events - Regular items
  menuList.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      await addToCart(currentMenu.find(m => m.id === parseInt(btn.dataset.id)));
      renderMenu();
    });
  });
  menuList.querySelectorAll(".plus-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      await addToCart(currentMenu.find(m => m.id === parseInt(btn.dataset.id)));
      renderMenu();
    });
  });
  menuList.querySelectorAll(".minus-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      await removeFromCart(parseInt(btn.dataset.id));
      renderMenu();
    });
  });

  // Events - Variant items
  menuList.querySelectorAll(".add-variant-trigger").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = currentMenu.find(m => m.id === parseInt(btn.dataset.id));
      showVariantPicker(item);
    });
  });
  menuList.querySelectorAll(".minus-variant-trigger").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = currentMenu.find(m => m.id === parseInt(btn.dataset.id));
      showVariantPicker(item);
    });
  });

  updateCartUI(cart);
}

// ===== VARIANT PICKER =====
function showVariantPicker(item) {
  document.getElementById("variant-picker-overlay")?.remove();
  const cart = getCart();

  let variantRows = "";
  item.variants.forEach(v => {
    const cartItem = cart.find(c => c.id === item.id && c.variantSize === v.size);
    const vQty = cartItem ? cartItem.qty : 0;
    variantRows += `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid #f3f4f6;">
        <div>
          <p style="font-weight:600;font-size:0.875rem;">${v.size}</p>
          <p style="font-size:0.8rem;color:#374151;font-weight:700;">₹${v.price}</p>
        </div>
        ${vQty === 0
          ? `<button class="vp-add-btn" data-id="${item.id}" data-size="${v.size}" data-price="${v.price}" style="border:2px solid #16a34a;color:#16a34a;font-weight:700;padding:0.4rem 1.2rem;border-radius:0.5rem;font-size:0.75rem;background:#fff;cursor:pointer;">ADD</button>`
          : `<div style="display:flex;align-items:center;gap:0.5rem;border:2px solid #16a34a;border-radius:0.5rem;padding:0.25rem 0.5rem;">
              <button class="vp-minus-btn" data-id="${item.id}" data-size="${v.size}" style="color:#16a34a;font-weight:700;font-size:1rem;background:none;border:none;cursor:pointer;padding:0 0.3rem;">−</button>
              <span style="font-weight:700;font-size:0.8rem;min-width:1rem;text-align:center;">${vQty}</span>
              <button class="vp-plus-btn" data-id="${item.id}" data-size="${v.size}" data-price="${v.price}" style="color:#16a34a;font-weight:700;font-size:1rem;background:none;border:none;cursor:pointer;padding:0 0.3rem;">+</button>
            </div>`
        }
      </div>`;
  });

  const overlay = document.createElement("div");
  overlay.id = "variant-picker-overlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:60;display:flex;align-items:flex-end;justify-content:center;";
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:1rem 1rem 0 0;width:100%;max-width:400px;padding:1.25rem;box-shadow:0 -4px 20px rgba(0,0,0,0.15);animation:slideUp 0.2s ease-out;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;">
        <div>
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <span style="width:0.85rem;height:0.85rem;border:2px solid ${item.veg ? '#16a34a' : '#dc2626'};border-radius:2px;display:flex;align-items:center;justify-content:center;">
              <span style="width:0.4rem;height:0.4rem;background:${item.veg ? '#16a34a' : '#dc2626'};border-radius:50%;"></span>
            </span>
            <h3 style="font-weight:700;font-size:1rem;">${item.name}</h3>
          </div>
          <p style="font-size:0.75rem;color:#6b7280;margin-top:0.2rem;">Select a size</p>
        </div>
        <button id="vp-close" style="background:none;border:none;font-size:1.25rem;cursor:pointer;color:#9ca3af;padding:0.25rem;">✕</button>
      </div>
      <div>${variantRows}</div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => { if (e.target === overlay) { overlay.remove(); renderMenu(); } });
  document.getElementById("vp-close").addEventListener("click", () => { overlay.remove(); renderMenu(); });

  overlay.querySelectorAll(".vp-add-btn, .vp-plus-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const variantItem = { ...item, price: parseInt(btn.dataset.price), variantSize: btn.dataset.size };
      await addToCart(variantItem);
      showVariantPicker(item);
    });
  });
  overlay.querySelectorAll(".vp-minus-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      await removeFromCart(parseInt(btn.dataset.id), btn.dataset.size);
      const updatedCart = getCart();
      const remaining = item.variants.reduce((sum, v) => {
        const ci = updatedCart.find(c => c.id === item.id && c.variantSize === v.size);
        return sum + (ci ? ci.qty : 0);
      }, 0);
      if (remaining === 0) { overlay.remove(); renderMenu(); }
      else { showVariantPicker(item); }
    });
  });
}

// ===== CART UI =====
function updateCartUI(cart) {
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const cartFab = document.getElementById("cart-fab");
  const cartFabCount = document.getElementById("cart-fab-count");
  const cartSidebarOpen = !document.getElementById("cart-sidebar").classList.contains("hidden");
  if (totalItems > 0 && !cartSidebarOpen) {
    cartFab.classList.remove("hidden");
    cartFabCount.textContent = totalItems;
  } else {
    cartFab.classList.add("hidden");
  }

  const badge = document.getElementById("header-cart-count");
  if (totalItems > 0) { badge.textContent = totalItems; badge.classList.remove("hidden"); }
  else { badge.classList.add("hidden"); }
}

// ===== CATEGORY SCROLL =====
document.getElementById("scroll-left")?.addEventListener("click", () => { tabsContainer.scrollBy({ left: -200, behavior: "smooth" }); });
document.getElementById("scroll-right")?.addEventListener("click", () => { tabsContainer.scrollBy({ left: 200, behavior: "smooth" }); });

// ===== LOAD MENU FROM SUPABASE =====
async function loadSupabaseMenu() {
  try {
    const dbMenu = await getMenuFromDB();
    if (dbMenu && dbMenu.length > 0) {
      supabaseMenu = dbMenu.map(item => ({
        id: item.id, name: item.name, price: item.price, desc: item.description || "",
        image: item.image || "", veg: item.veg, category: item.category,
        available: item.available, variants: item.variants || null
      }));
      renderMenu();
    } else {
      supabaseMenu = [];
      renderMenu();
    }
  } catch (err) {
    console.log("Supabase not available:", err);
  }
}

// ===== CART SIDEBAR =====
function openCart() {
  document.getElementById("cart-overlay").classList.remove("hidden");
  document.getElementById("cart-sidebar").classList.remove("hidden");
  document.getElementById("chatbot-bubble")?.classList.add("hidden");
  document.getElementById("chat-window")?.classList.add("hidden");
  document.getElementById("cart-fab")?.classList.add("hidden");
  renderCartSidebar();
}
window.openCart = openCart;

function closeCart() {
  document.getElementById("cart-overlay").classList.add("hidden");
  document.getElementById("cart-sidebar").classList.add("hidden");
  document.getElementById("chatbot-bubble")?.classList.remove("hidden");
  const cart = getCart();
  if (cart.length > 0) { document.getElementById("cart-fab")?.classList.remove("hidden"); }
}

document.getElementById("close-cart").addEventListener("click", closeCart);
document.getElementById("cart-overlay").addEventListener("click", closeCart);

function renderCartSidebar() {
  const cart = getCart();
  const emptyEl = document.getElementById("cart-empty");
  const itemsList = document.getElementById("cart-items-list");
  const billEl = document.getElementById("cart-bill");
  const footerEl = document.getElementById("cart-footer");
  const successEl = document.getElementById("cart-success");

  successEl.classList.add("hidden");
  document.getElementById("cart-body").classList.remove("hidden");

  if (cart.length === 0) {
    emptyEl.classList.remove("hidden");
    itemsList.innerHTML = "";
    billEl.classList.add("hidden");
    footerEl.classList.add("hidden");
    return;
  }

  emptyEl.classList.add("hidden");
  billEl.classList.remove("hidden");
  footerEl.classList.remove("hidden");

  itemsList.innerHTML = "";
  cart.forEach(item => {
    const sizeLabel = item.variantSize ? ` <span class="text-[10px] text-orange-600 font-medium">(${item.variantSize})</span>` : "";
    const div = document.createElement("div");
    div.className = "flex items-center justify-between py-3 border-b border-gray-100";
    div.innerHTML = `
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 border-2 ${item.veg ? "border-green-600" : "border-red-600"} rounded-sm flex items-center justify-center shrink-0">
            <span class="w-1.5 h-1.5 ${item.veg ? "bg-green-600" : "bg-red-600"} rounded-full"></span>
          </span>
          <p class="font-medium text-sm truncate">${item.name}${sizeLabel}</p>
        </div>
        <p class="text-xs text-gray-500 ml-4.5">₹${item.price}</p>
      </div>
      <div class="flex items-center gap-3 ml-3 shrink-0">
        <div class="flex items-center gap-1.5 border rounded-md px-1.5 py-0.5">
          <button class="cart-minus text-green-600 font-bold text-sm" data-id="${item.id}" data-size="${item.variantSize || ""}">−</button>
          <span class="text-xs font-bold w-4 text-center">${item.qty}</span>
          <button class="cart-plus text-green-600 font-bold text-sm" data-id="${item.id}" data-size="${item.variantSize || ""}">+</button>
        </div>
        <span class="text-sm font-medium w-12 text-right">₹${item.price * item.qty}</span>
      </div>`;
    itemsList.appendChild(div);
  });

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById("sidebar-subtotal").textContent = "₹" + subtotal;
  document.getElementById("sidebar-total").textContent = "₹" + (subtotal + 30);

  const user = getCurrentUser();
  document.getElementById("sidebar-address").textContent = user.address || "Please set address in profile";

  itemsList.querySelectorAll(".cart-plus").forEach(btn => {
    btn.addEventListener("click", async () => {
      const variantSize = btn.dataset.size || "";
      const item = cart.find(c => c.id === parseInt(btn.dataset.id) && (c.variantSize || "") === variantSize);
      await addToCart(item);
      renderCartSidebar();
      renderMenu();
    });
  });
  itemsList.querySelectorAll(".cart-minus").forEach(btn => {
    btn.addEventListener("click", async () => {
      const variantSize = btn.dataset.size || "";
      await removeFromCart(parseInt(btn.dataset.id), variantSize);
      renderCartSidebar();
      renderMenu();
    });
  });
}

// ===== STORE HOURS CHECK =====
function isStoreOpen() {
  const hour = new Date().getHours();
  return hour >= 11 && hour < 23; // Open 11 AM to 11 PM
}

function showStoreStatus() {
  const menuSection = document.getElementById("menu-section");
  if (!menuSection) return;
  let banner = document.getElementById("store-closed-banner");
  if (!isStoreOpen()) {
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "store-closed-banner";
      banner.style.cssText = "background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:0.75rem 1rem;border-radius:0.75rem;font-size:0.85rem;font-weight:600;text-align:center;margin-bottom:1rem;";
      banner.textContent = "We're currently closed. Ordering is available from 11:00 AM to 11:00 PM.";
      menuSection.prepend(banner);
    }
  } else if (banner) {
    banner.remove();
  }
}

// ===== PLACE ORDER =====
document.getElementById("place-order-btn").addEventListener("click", async () => {
  if (!isStoreOpen()) {
    alert("Sorry, we're closed! Orders are accepted only from 11:00 AM to 11:00 PM.");
    return;
  }

  const user = getCurrentUser();
  if (!user.loggedIn) { window.location.href = "/login.html"; return; }
  if (!user.phone || user.phone.trim() === "") { alert("Please add your phone number in Edit Profile before ordering"); window.location.href = "/profile.html"; return; }
  if (!user.address) { alert("Please set your delivery address in Edit Profile"); return; }

  const cart = getCart();
  if (cart.length === 0) return;

  const order = {
    id: "ORD" + Date.now(),
    items: cart,
    user_info: { name: user.name || "", phone: user.phone || "", email: user.email || "", address: user.address || "", lat: user.lat || null, lng: user.lng || null },
    total: cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    status: "Placed"
  };

  await placeOrderDB(order);
  await clearCart();

  document.getElementById("cart-body").classList.add("hidden");
  document.getElementById("cart-footer").classList.add("hidden");
  document.getElementById("cart-success").classList.remove("hidden");
  document.getElementById("sidebar-order-id").textContent = order.id;

  renderMenu();
});

// ===== START APP (all functions defined above) =====
init();
