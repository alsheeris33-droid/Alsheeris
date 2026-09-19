import "./style.css";
import { getCurrentUser, clearCurrentUser, loadCart, getCart } from "./data.js";

function checkAuth() {
  const authSection = document.getElementById("auth-section");
  const authText = document.getElementById("auth-text");
  const profileDropdown = document.getElementById("profile-dropdown");
  const signOutBtn = document.getElementById("sign-out-btn");
  if (!authSection || !authText) return;

  const user = getCurrentUser();
  if (user.loggedIn) {
    authText.innerHTML = '<svg class="w-6 h-6 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M5 21v-1a7 7 0 0114 0v1"/></svg>';
    const nameEl = document.getElementById("profile-name");
    if (nameEl) nameEl.textContent = user.name || "User";
    const phoneEl = document.getElementById("profile-phone");
    if (phoneEl) phoneEl.textContent = user.email || "";

    authSection.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown?.classList.toggle("hidden");
    });

    signOutBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      clearCurrentUser();
      window.location.reload();
    });

    document.addEventListener("click", () => {
      profileDropdown?.classList.add("hidden");
    });
  } else {
    authText.textContent = "Sign In";
    authSection.addEventListener("click", () => {
      window.location.href = "/login.html";
    });
  }
}

async function updateHeaderCart() {
  try {
    await loadCart();
  } catch (e) {
    console.log("Cart load failed:", e);
  }
  const cart = getCart();
  const totalItems = (cart || []).reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById("header-cart-count");
  if (badge) {
    if (totalItems > 0) {
      badge.textContent = totalItems;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }
}

checkAuth();
updateHeaderCart();
