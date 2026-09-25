/* კალათა — everrest API-ით (token საჭიროა) */
const itemsBox = document.querySelector("#cartItems");
const summaryBox = document.querySelector("#cartSummary");

let productMap = {}; // id → product (დეტალებისთვის: სახელი, ფოტო)

async function loadCart() {
  if (!getToken()) {
    itemsBox.innerHTML = "<p class='cart-msg'>კალათის სანახავად ჯერ შედი სისტემაში 🔑</p>";
    summaryBox.innerHTML = "";
    return;
  }

  if (Object.keys(productMap).length === 0) {
    const data = await fetch("https://api.everrest.educata.dev/shop/products/all?page_size=40").then((r) => r.json());
    data.products.forEach((p) => (productMap[p._id] = p));
  }

  const res = await fetch(BASE + "/shop/cart", { headers: authHeaders() });

  if (res.status === 409) {
    itemsBox.innerHTML = "<p class='cart-msg'>ჯერ დაადასტურე ელ. ფოსტა — შეამოწმე წერილი ✉️</p>";
    summaryBox.innerHTML = "";
    return;
  }
  if (!res.ok) {
    itemsBox.innerHTML = "<p class='cart-msg'>კალათა ცარიელია 🛒</p>";
    summaryBox.innerHTML = "";
    updateCartBadge();
    return;
  }

  const cart = await res.json();
  renderCart(cart);
}

function renderCart(cart) {
  if (!cart.products || cart.products.length === 0) {
    itemsBox.innerHTML = "<p class='cart-msg'>კალათა ცარიელია 🛒</p>";
    summaryBox.innerHTML = "";
    updateCartBadge();
    return;
  }

  itemsBox.innerHTML = cart.products
    .map((item) => {
      const p = productMap[item.productId] || {};
      return `
      <div class="cart-row">
        <img src="${p.thumbnail || ""}" alt="">
        <div class="cart-row-info">
          <h3>${p.title || "პროდუქტი"}</h3>
          <span class="muted">${item.pricePerQuantity} USD</span>
        </div>
        <div class="qty">
          <button class="qty-btn" data-action="dec" data-id="${item.productId}">−</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.productId}">+</button>
        </div>
        <div class="cart-row-total">${(item.pricePerQuantity * item.quantity).toFixed(2)} USD</div>
        <button class="remove-btn" data-id="${item.productId}">🗑</button>
      </div>`;
    })
    .join("");

  summaryBox.innerHTML = `
    <div class="summary-row"><span>ნივთები:</span><span>${cart.total.products}</span></div>
    <div class="summary-row sum-total"><span>ჯამი:</span><strong>${cart.total.price.current.toFixed(2)} USD</strong></div>
    <button class="btn" id="checkoutBtn">შეკვეთის გაფორმება</button>`;

  updateCartBadge();
}

itemsBox.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  const cart = await getCart();
  const item = cart?.products?.find((p) => p.productId === id);
  if (!item) return;

  if (e.target.classList.contains("qty-btn")) {
    const newQty = e.target.dataset.action === "inc" ? item.quantity + 1 : item.quantity - 1;
    await setCartQty(id, newQty); // 0 → API თვითონ შლის
  }

  if (e.target.classList.contains("remove-btn")) {
    await removeCartItem(id);
  }

  loadCart();
});

/* შეკვეთის გაფორმება */
summaryBox.addEventListener("click", async (e) => {
  if (e.target.id === "checkoutBtn") {
    const ok = await checkoutCart();
    if (ok) {
      showToast("შეკვეთა წარმატებით გაფორმდა! 🎉");
      loadCart();
    } else {
      showToast("ვერ მოხერხდა გადახდა", "error");
    }
  }
});

loadCart();
