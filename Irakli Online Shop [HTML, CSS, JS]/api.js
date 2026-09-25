const BASE = "https://api.everrest.educata.dev";
const AVATAR_DEFAULT = "https://i.pravatar.cc/150";

function getToken() {
  return localStorage.getItem("token");
}
function setToken(t) {
  localStorage.setItem("token", t);
}
function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("profileData");
}

function getProfile() {
  const u = currentUser();
  if (!u) return null;
  const saved = JSON.parse(localStorage.getItem("profileData") || "{}");
  return { ...u, ...saved };
}

function currentUser() {
  const t = getToken();
  if (!t) return null;
  try {

    const base64 = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(json);
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      clearToken();
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + getToken(),
  };
}

function showToast(message, type = "success") {
  let toast = document.querySelector("#toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.className = "toast " + type;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2800);
}


const authModal = document.querySelector("#authModal");
const tabs = document.querySelectorAll(".auth-tab");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");

document.querySelector("#loginBtn")?.addEventListener("click", () => openAuth("login"));
document.querySelector("#signupBtn")?.addEventListener("click", () => openAuth("register"));
document.querySelector("#modalClose")?.addEventListener("click", () => authModal?.classList.remove("open"));
authModal?.addEventListener("click", (e) => {
  if (e.target === authModal) authModal.classList.remove("open");
});

function openAuth(tab) {
  authModal?.classList.add("open");
  switchTab(tab);
}
function switchTab(tab) {
  tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  if (loginForm) loginForm.hidden = tab !== "login";
  if (registerForm) registerForm.hidden = tab !== "register";
}
tabs.forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));


registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();


  const get = (id) => document.querySelector(id)?.value.trim() || "";
  let phone = get("#regPhone");
  if (phone && !phone.startsWith("+")) phone = "+995" + phone; // ავტო-პრეფიქსი

  const body = {
    firstName: get("#regFirstName"),
    lastName: get("#regLastName"),
    age: Number(get("#regAge")),
    email: get("#regEmail"),
    password: document.querySelector("#regPassword").value,
    address: get("#regAddress"),
    phone: phone,
    zipcode: get("#regZipcode"),
    gender: get("#regGender"),
    avatar: get("#regAvatar") || AVATAR_DEFAULT,
  };


  if (!body.firstName || !body.lastName || !body.email || !body.password) {
    showToast("შეავსე ყველა აუცილებელი ველი", "error");
    return;
  }
  if (body.password.length < 8) {
    showToast("პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო", "error");
    return;
  }

  try {
    const res = await fetch(BASE + "/auth/sign_up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(translateError(data), "error");
      return;
    }

    fetch(BASE + "/auth/verify_email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email }),
    }).catch(() => {});

    showToast("რეგისტრაცია წარმატებულია! დაადასტურე ელ. ფოსტა (შეამოწმე წერილი) ✅");
    registerForm.reset();
    switchTab("login");
  } catch (err) {
    showToast("შეცდომა — სცადე თავიდან", "error");
    console.error(err);
  }
});

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.querySelector("#loginEmail").value.trim();
  const password = document.querySelector("#loginPassword").value;

  try {
    const res = await fetch(BASE + "/auth/sign_in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(translateError(data), "error");
      return;
    }

    setToken(data.access_token); // token შენახვა
    showToast("მოგესალმებით, " + (currentUser()?.firstName || "") + " 👋");
    authModal?.classList.remove("open");
    loginForm.reset();
    updateAuthUI();
    updateCartBadge();
  } catch (err) {
    showToast("შეცდომა — სცადე თავიდან", "error");
    console.error(err);
  }
});

function translateError(data) {
  const key = data?.errorKeys?.[0] || "";
  const map = {
    "errors.email_already_exists": "ეს ელ. ფოსტა უკვე რეგისტრირებულია",
    "errors.incorrect_email_or_password": "ელ. ფოსტა ან პაროლი არასწორია",
    "errors.invalid_phone_number": "ტელეფონის ნომერი არასწორია (მაგ. +995599...)",
    "errors.invalid_gender": "სქესი არასწორია",
    "errors.user_email_not_verified": "ჯერ დაადასტურე ელ. ფოსტა (შეამოწმე წერილი)",
  };
  if (map[key]) return map[key];
  if (key.includes("stock")) return "ეს პროდუქტი მარაგში არ არის 😔";
  return data?.message || data?.error || "შეცდომა";
}


function updateAuthUI() {
  const user = getProfile();
  const loginBtn = document.querySelector("#loginBtn");
  const signupBtn = document.querySelector("#signupBtn");
  const profileBtn = document.querySelector("#profileBtn");

  if (user) {
    if (loginBtn) loginBtn.style.display = "none";
    if (signupBtn) signupBtn.style.display = "none";
    if (profileBtn) {
      profileBtn.style.display = "inline-flex";
      profileBtn.textContent = "👤 " + user.firstName;
    }
  } else {
    if (loginBtn) loginBtn.style.display = "inline-flex";
    if (signupBtn) signupBtn.style.display = "inline-flex";
    if (profileBtn) profileBtn.style.display = "none";
  }
}

document.querySelector("#profileBtn")?.addEventListener("click", () => {
  window.location.href = "profile.html";
});
document.querySelector("#cartBtn")?.addEventListener("click", () => {
  if (!getToken()) {
    openAuth("login");
    showToast("ჯერ შედი სისტემაში", "error");
    return;
  }
  window.location.href = "cart.html";
});


async function getCart() {
  if (!getToken()) return null;
  try {
    const res = await fetch(BASE + "/shop/cart", { headers: authHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function updateCartBadge() {
  const badge = document.querySelector(".cart-count");
  if (!badge) return;
  const cart = await getCart();
  badge.textContent = cart?.total?.quantity || 0;
}

async function addToCart(productId, qty = 1) {
  if (!getToken()) {
    openAuth("login");
    showToast("ჯერ შედი სისტემაში", "error");
    return;
  }

  const cart = await getCart();
  const hasCart = cart && Array.isArray(cart.products);
  const existing = hasCart ? cart.products.find((p) => p.productId === productId) : null;
  const newQty = (existing ? existing.quantity : 0) + qty;

  let res;
  if (!hasCart) {
    res = await fetch(BASE + "/shop/cart/product", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ id: productId, quantity: qty }),
    });
    if (!res.ok) {
      res = await fetch(BASE + "/shop/cart/product", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ id: productId, quantity: newQty }),
      });
    }
  } else {
    res = await fetch(BASE + "/shop/cart/product", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ id: productId, quantity: newQty }),
    });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Cart error:", data);
    showToast(translateError(data), "error");
    return;
  }
  showToast("დაემატა კალათაში ✅");
  updateCartBadge();
}

async function setCartQty(productId, quantity) {
  const res = await fetch(BASE + "/shop/cart/product", {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ id: productId, quantity }),
  });
  return res.ok;
}

async function removeCartItem(productId) {
  const res = await fetch(BASE + "/shop/cart/product", {
    method: "DELETE",
    headers: authHeaders(),
    body: JSON.stringify({ id: productId }),
  });
  return res.ok;
}

async function checkoutCart() {
  const res = await fetch(BASE + "/shop/cart/checkout", {
    method: "POST",
    headers: authHeaders(),
  });
  return res.ok;
}

const navEl = document.querySelector(".nav");
const menuBackdrop = document.querySelector("#menuBackdrop");

document.querySelector("#menuToggle")?.addEventListener("click", () => {
  navEl?.classList.toggle("open");
  menuBackdrop?.classList.toggle("open");
});
menuBackdrop?.addEventListener("click", () => {
  navEl?.classList.remove("open");
  menuBackdrop?.classList.remove("open");
});
document.querySelectorAll(".nav a").forEach((a) =>
  a.addEventListener("click", () => {
    navEl?.classList.remove("open");
    menuBackdrop?.classList.remove("open");
  })
);

updateAuthUI();
updateCartBadge();
