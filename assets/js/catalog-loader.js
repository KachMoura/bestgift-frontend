document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("catalog-container");
  const genderFilter = document.getElementById("filter-gender");
  const profileFilter = document.getElementById("filter-profile");
  const priceFilter = document.getElementById("filter-price");

  const baseApi = "https://bestgift-backend.onrender.com"; // Sans crochets ni slash final

  function escapeHTML(str) {
    if (!str || typeof str !== "string") return "";
    return str.replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));
  }

  function loadCatalog() {
    fetch(`${baseApi}/api/catalogue`)
      .then((res) => res.json())
      .then((products) => {
        container.innerHTML = "";
        const gender = genderFilter.value.toLowerCase();
        const profile = profileFilter.value.toLowerCase();
        const maxPrice = parseFloat(priceFilter.value);

        const filtered = products.filter((p) => {
          const genderField = (p.gender || "").toLowerCase();
          const profileField = ((p.profile || "") + " " + (p.tags || "")).toLowerCase();
          const price = parseFloat(p.price);
          const matchesGender = !gender || genderField === gender;
          const matchesProfile = !profile || profileField.includes(profile);
          const matchesPrice = isNaN(maxPrice) || price <= maxPrice;
          return matchesGender && matchesProfile && matchesPrice;
        });

        if (filtered.length === 0) {
          container.innerHTML = `<p class="text-center w-100">Aucun produit trouvé.</p>`;
          return;
        }

        filtered.forEach((p) => {
          const title = escapeHTML(p.title);
          const description = escapeHTML(p.description || "Produit BestGift");
          const image = escapeHTML(p.image_url || "");
          const price = parseFloat(p.price).toFixed(2);
          const id = escapeHTML(p.id ? String(p.id) : title);

          const card = document.createElement("div");
          card.className = "col-sm-6 col-md-4 col-lg-3";
          card.innerHTML = `
            <div class="product-card">
              <img src="${image}" alt="${title}">
              <div class="detail-box">
                <h6 class="title">${title}</h6>
                <p class="price">Prix : ${price} €</p>
                <button
                  class="btn btn-sm btn-primary snipcart-add-item"
                  data-item-id="${id}"
                  data-item-name="${title}"
                  data-item-price="${price}"
                  data-item-url="https://bestgift-frontend.onrender.com/shop.html"
                  data-item-description="${description}"
                  data-item-image="${image}"
                  data-item-currency="eur"
                >
                  Ajouter au panier
                </button>
              </div>
            </div>
          `;
          container.appendChild(card);
        });
      })
      .catch((err) => {
        container.innerHTML = `<p class="text-danger w-100">Erreur de chargement du catalogue.</p>`;
        console.error("[catalog-loader] Erreur :", err.message);
      });
  }

  loadCatalog();
  [genderFilter, profileFilter, priceFilter].forEach((el) =>
    el.addEventListener("change", loadCatalog)
  );
});
