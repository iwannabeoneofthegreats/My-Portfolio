const grid = document.querySelector("#productGrid");
const slidesEl = document.querySelector("#slides");
const dotsEl = document.querySelector("#dots");
const catsEl = document.querySelector("#categories");
const header = document.querySelector(".header");
const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");
const searchBackdrop = document.querySelector("#searchBackdrop");
const brandEl = document.querySelector("#brandFilter");

const PRODUCTS_API = "https://api.everrest.educata.dev/shop/products/all?page_size=40";

let allProducts = [];
let slideIndex = 0;
let slideTimer;
let lastScroll = 0;
let currentList = [];
let currentPage = 1;
const perPage = 12;

window.addEventListener("scroll", () => {
  const current = window.scrollY;
  if (current > lastScroll && current > 100) header?.classList.add("hide");
  else header?.classList.remove("hide");
  lastScroll = current;
});

fetch(PRODUCTS_API)
  .then((r) => r.json())
  .then((data) => {
    allProducts = data.products;
    buildSlideshow(allProducts.slice(0, 5));
    buildCategories(allProducts);
    buildBrands(allProducts);
    renderProducts(allProducts);
  })
  .catch((err) => {
    if (grid) grid.innerHTML = "ver moxerxda informaciis wamogeba";
    console.error(err);
  });

function card(p) {
  const hasDiscount = p.price.discountPercentage > 0;
  return `<div class="card" data-id="${p._id}">
    <div class="card-img">
      <img src="${p.thumbnail}" alt="${p.title}" />
      ${hasDiscount ? `<span class="badge">-${p.price.discountPercentage}%</span>` : ""}
    </div>
    <div class="card-info">
      <span class="cat">${p.category.name}</span>
      <h3 class="title">${p.title}</h3>
      <div class="rating">⭐ ${p.rating.toFixed(1)}</div>
      <div class="stock-info ${p.stock > 0 ? "in" : "out"}">${p.stock > 0 ? "✔ მარაგში: " + p.stock + " ც." : "✖ ამოიწურა"}</div>
      <div class="card-bottom">
        <div class="price">
          ${p.price.current} ${p.price.currency}
          ${hasDiscount ? `<span class="old-price">${p.price.beforeDiscount} ${p.price.currency}</span>` : ""}
        </div>
        <button class="add-btn" data-id="${p._id}" ${p.stock > 0 ? "" : "disabled"}>${p.stock > 0 ? "Add To Cart" : "ამოიწურა"}</button>
      </div>
    </div>
  </div>`;
}

function renderProducts(items) {
  currentList = items;
  currentPage = 1;
  showPage(1);
}

function showPage(page) {
  currentPage = page;
  const start = (page - 1) * perPage;
  const pageItems = currentList.slice(start, start + perPage);
  grid.innerHTML = pageItems.map(card).join("");
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(currentList.length / perPage);
  const pag = document.querySelector("#pages");
  if (!pag) return;

  if (totalPages <= 1) {
    pag.innerHTML = "";
    return;
  }

  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  pag.innerHTML = html;

  pag.querySelectorAll(".page-btn").forEach((b) =>
    b.addEventListener("click", () => {
      showPage(+b.dataset.page);
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    })
  );
}

document.querySelector("#sortSelect")?.addEventListener("change", (e) => {
  const val = e.target.value;
  if (val === "price-asc") currentList.sort((a, b) => a.price.current - b.price.current);
  else if (val === "price-desc") currentList.sort((a, b) => b.price.current - a.price.current);
  else if (val === "rating") currentList.sort((a, b) => b.rating - a.rating);
  showPage(1);
});

grid?.addEventListener("click", (e) => {
  if (e.target.classList.contains("add-btn")) {
    addToCart(e.target.dataset.id); // api.js-დან
    return;
  }
  const cardEl = e.target.closest(".card");
  if (cardEl) window.location.href = "details.html?id=" + cardEl.dataset.id;
});

searchInput?.addEventListener("input", () => {
  const text = searchInput.value.toLowerCase().trim();
  if (text === "") {
    closeSearch();
    return;
  }

  const filtered = allProducts.filter((p) => p.title.toLowerCase().includes(text));

  searchResults.innerHTML = filtered.length
    ? filtered.map((p) => `
        <div class="search-result" data-id="${p._id}">
          <img src="${p.thumbnail}" alt="">
          <div>
            <div class="r-title">${p.title}</div>
            <div class="r-price">${p.price.current} ${p.price.currency}</div>
          </div>
        </div>`).join("")
    : "<p style='padding:14px;color:#888;'>ვერაფერი მოიძებნა 🔍</p>";

  searchResults.classList.add("open");
  searchBackdrop.classList.add("open");
});

searchResults?.addEventListener("click", (e) => {
  const item = e.target.closest(".search-result");
  if (item) window.location.href = "details.html?id=" + item.dataset.id;
});

searchBackdrop?.addEventListener("click", closeSearch);

function closeSearch() {
  searchResults?.classList.remove("open");
  searchBackdrop?.classList.remove("open");
}

function buildSlideshow(items) {
  slidesEl.innerHTML = items.map((p, i) => `
    <div class="slide ${i === 0 ? "active" : ""}">
      <div class="slide-text">
        <span class="slide-cat">${p.category.name}</span>
        <h2>${p.title}</h2>
        <p class="slide-price">${p.price.current} ${p.price.currency}</p>
        <button class="slide-btn" onclick="window.location.href='details.html?id=${p._id}'">ნახვა</button>
      </div>
      <img src="${p.thumbnail}" alt="${p.title}" />
    </div>`).join("");

  dotsEl.innerHTML = items.map((_, i) =>
    `<span class="dot ${i === 0 ? "active" : ""}" data-i="${i}"></span>`).join("");

  dotsEl.querySelectorAll(".dot").forEach((d) =>
    d.addEventListener("click", () => { showSlide(+d.dataset.i); startAuto(); }));

  startAuto();
}

function showSlide(i) {
  const slides = slidesEl.querySelectorAll(".slide");
  const dots = dotsEl.querySelectorAll(".dot");
  if (!slides.length) return;
  slideIndex = (i + slides.length) % slides.length;
  slides.forEach((s, idx) => s.classList.toggle("active", idx === slideIndex));
  dots.forEach((d, idx) => d.classList.toggle("active", idx === slideIndex));
}

function startAuto() {
  clearInterval(slideTimer);
  slideTimer = setInterval(() => showSlide(slideIndex + 1), 4000);
}

document.querySelector("#prevBtn")?.addEventListener("click", () => { showSlide(slideIndex - 1); startAuto(); });
document.querySelector("#nextBtn")?.addEventListener("click", () => { showSlide(slideIndex + 1); startAuto(); });

/* ===== Categories ===== */
function buildCategories(products) {
  const map = new Map();
  products.forEach((p) => {
    if (!map.has(p.category.name)) map.set(p.category.name, p.thumbnail);
  });

  let html = `<button class="cat-card active" data-cat="all">
      <div class="cat-icon">🛍️</div><span>ყველა</span></button>`;

  map.forEach((img, name) => {
    html += `<button class="cat-card" data-cat="${name}">
        <img src="${img}" alt="${name}" /><span>${name}</span></button>`;
  });

  catsEl.innerHTML = html;

  catsEl.querySelectorAll(".cat-card").forEach((btn) =>
    btn.addEventListener("click", () => {
      catsEl.querySelectorAll(".cat-card").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.cat;
      const list = cat === "all" ? allProducts : allProducts.filter((p) => p.category.name === cat);
      renderProducts(list);
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    })
  );
}

function buildBrands(products) {
  const brands = [...new Set(products.map((p) => p.brand))].filter(Boolean).sort();

  let html = `<li class="active" data-brand="all">ყველა</li>`;
  brands.forEach((b) => {
    html += `<li data-brand="${b}">${b}</li>`;
  });
  brandEl.innerHTML = html;

  brandEl.querySelectorAll("li").forEach((li) =>
    li.addEventListener("click", () => {
      brandEl.querySelectorAll("li").forEach((x) => x.classList.remove("active"));
      li.classList.add("active");
      const brand = li.dataset.brand;
      const list = brand === "all" ? allProducts : allProducts.filter((p) => p.brand === brand);
      renderProducts(list);
    })
  );
}
