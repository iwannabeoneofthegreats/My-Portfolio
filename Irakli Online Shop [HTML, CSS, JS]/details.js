const PRODUCTS_API = "https://api.everrest.educata.dev/shop/products/all?page_size=40";
const id = new URLSearchParams(location.search).get("id");
const box = document.querySelector("#productDetail");

fetch(PRODUCTS_API)
  .then((r) => r.json())
  .then((data) => {
    const p = data.products.find((x) => x._id === id);
    if (!p) {
      box.innerHTML = "პროდუქტი ვერ მოიძებნა";
      return;
    }

    const hasDiscount = p.price.discountPercentage > 0;

    box.innerHTML = `
      <div class="detail">
        <div class="detail-img"><img src="${p.thumbnail}" alt="${p.title}"></div>
        <div class="detail-info">
          <span class="cat">${p.category.name}</span>
          <h1>${p.title}</h1>
          <div class="rating">⭐ ${p.rating.toFixed(1)} · ბრენდი: ${p.brand}</div>
          <div class="stock-info ${p.stock > 0 ? "in" : "out"}">${p.stock > 0 ? "✔ მარაგში: " + p.stock + " ცალი" : "✖ ამოიწურა"}</div>
          <p style="color:#555; margin:16px 0;">${p.description}</p>
          <div class="price" style="font-size:26px;">
            ${p.price.current} ${p.price.currency}
            ${hasDiscount ? `<span class="old-price">${p.price.beforeDiscount} ${p.price.currency}</span>` : ""}
          </div>
          <button class="btn" style="margin-top:16px;" id="addBtn" ${p.stock > 0 ? "" : "disabled"}>${p.stock > 0 ? "Add To Cart" : "ამოიწურა (მარაგში არ არის)"}</button>
        </div>
      </div>`;

    document.querySelector("#addBtn").addEventListener("click", () => addToCart(p._id));
  });

const reviewForm = document.querySelector("#reviewForm");
const reviewsList = document.querySelector("#reviewsList");

reviewForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const user = currentUser();
  if (!user) {
    showToast("შეფასების დასაწერად ჯერ შედი სისტემაში 🔑", "error");
    openAuth("login");
    return;
  }

  const rating = document.querySelector("#reviewRating").value;
  const text = document.querySelector("#reviewText").value.trim();
  if (text === "") return;

  const name = user.firstName;

  let reviews = JSON.parse(localStorage.getItem("reviews_" + id)) || [];
  reviews.push({ name, rating, text });
  localStorage.setItem("reviews_" + id, JSON.stringify(reviews));

  reviewForm.reset();
  renderReviews();
});

function renderReviews() {
  const reviews = JSON.parse(localStorage.getItem("reviews_" + id)) || [];

  reviewsList.innerHTML = reviews.length
    ? reviews
        .map((r) => `
          <div class="review">
            <div class="review-head">
              <strong>${r.name}</strong>
              <span>${"⭐".repeat(r.rating)}</span>
            </div>
            <p>${r.text}</p>
          </div>`)
        .join("")
    : "<p style='color:#888;'>ჯერ შეფასება არ აქვს ამ პროდუქტს!</p>";
}

renderReviews();
