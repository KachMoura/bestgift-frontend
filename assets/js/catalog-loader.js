document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("catalog-container");
  const genderFilter = document.getElementById("filter-gender");
  const profileFilter = document.getElementById("filter-profile");
  const priceMinInput = document.getElementById("price-min");
  const priceMaxInput = document.getElementById("price-max");
  const priceMinDisplay = document.getElementById("price-min-val");
  const priceMaxDisplay = document.getElementById("price-max-val");

  const baseApi = "https://bestgift-backend.onrender.com"; // ✅ Corrigé

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

  function updatePriceDisplays() {
    priceMinDisplay.textContent = priceMinInput.value;
    priceMaxDisplay.textContent = priceMaxInput.value;
  }

  function loadCatalog() {
    fetch(`${baseApi}/api/catalogue`)
      .then((res) => res.json())
      .then((products) => {
        container.innerHTML = "";
        const gender = genderFilter.value.toLowerCase();
        const profile = profileFilter.value.toLowerCase();
        const priceMin = parseFloat(priceMinInput.value);
        const priceMax = parseFloat(priceMaxInput.value);

        const filtered = products.filter((p) => {
          const genderField = (p.gender || "").toLowerCase();
          const profileField = ((p.profile || "") + " " + (p.tags || "")).toLowerCase();
          const price = parseFloat(p.price);
          const matchesGender = !gender || genderField === gender;
          const matchesProfile = !profile || profileField.includes(profile);
          const matchesPrice = !isNaN(priceMin) && !isNaN(priceMax) && price >= priceMin && price <= priceMax;
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
                <div class="d-flex justify-content-center gap-2">
                  <button
                    class="btn btn-sm btn-primary snipcart-add-item mr-2"
                    data-item-id="${id}"
                    data-item-name="${title}"
                    data-item-price="${price}"
                    data-item-url="https://www.bestgift.fr/product-${id}.html"
                    data-item-description="${description}"
                    data-item-image="${image}"
                    data-item-currency="eur"
                  >
                    Ajouter au panier
                  </button>
                  <a href="https://www.bestgift.fr/product-${id}.html"  class="btn btn-sm btn-outline-secondary">
                    Consulter
                  </a>
                </div>
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

  // Initialisation
  updatePriceDisplays();
  loadCatalog();

  // Rafraîchir si filtres changent
  [genderFilter, profileFilter, priceMinInput, priceMaxInput].forEach((el) =>
    el.addEventListener("change", () => {
      updatePriceDisplays();
      loadCatalog();
    })
  );
});
