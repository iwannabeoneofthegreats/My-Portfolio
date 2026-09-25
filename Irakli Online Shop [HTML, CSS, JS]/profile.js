if (!getToken()) {
  window.location.href = "index.html";
}

const get = (id) => document.querySelector(id).value.trim();

function loadProfile() {
  const u = getProfile();
  if (!u) {
    window.location.href = "index.html";
    return;
  }
  document.querySelector("#editFirstName").value = u.firstName || "";
  document.querySelector("#editLastName").value = u.lastName || "";
  document.querySelector("#editEmail").value = u.email || "";
  document.querySelector("#editAge").value = u.age || "";
  document.querySelector("#editPhone").value = u.phone || "";
  document.querySelector("#editAddress").value = u.address || "";
  document.querySelector("#editZipcode").value = u.zipcode || "";

  const avatar = document.querySelector("#profileAvatar");
  if (avatar && u.avatar) avatar.src = u.avatar;
}
loadProfile();

document.querySelector("#profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  let phone = get("#editPhone");
  if (phone && !phone.startsWith("+")) phone = "+995" + phone;

  const body = {
    firstName: get("#editFirstName"),
    lastName: get("#editLastName"),
    age: Number(get("#editAge")),
    phone: phone,
    address: get("#editAddress"),
    zipcode: get("#editZipcode"),
  };

  const res = await fetch(BASE + "/auth/update", {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    showToast(translateError(data), "error");
    return;
  }

  localStorage.setItem("profileData", JSON.stringify(body));
  updateAuthUI();
  showToast("პროფილი განახლდა ✅");
});

document.querySelector("#togglePass")?.addEventListener("click", () => {
  const box = document.querySelector("#passBox");
  box.style.display = box.style.display === "none" ? "block" : "none";
});

document.querySelector("#passForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const oldPassword = document.querySelector("#oldPass").value;
  const newPassword = document.querySelector("#newPass").value;

  if (newPassword.length < 8) {
    showToast("ახალი პაროლი მინიმუმ 8 სიმბოლო", "error");
    return;
  }

  const res = await fetch(BASE + "/auth/change_password", {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    showToast(data?.error || "პაროლი ვერ შეიცვალა", "error");
    return;
  }
  showToast("პაროლი შეიცვალა ✅");
  e.target.reset();
});

document.querySelector("#logoutBtn").addEventListener("click", () => {
  clearToken();
  window.location.href = "index.html";
});
