document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("catalog-container");
  const genderFilter = document.getElementById("filter-gender");
  const profileFilter = document.getElementById("filter-profile");
  const priceFilter = document.getElementById("filter-price");

  const baseApi = "https://bestgift-backend.onrender.com"; // Pas de [] ni slash final

  function loadCatalog() {
    fetch(`${baseApi}/api/catalogue`)
      .then((res) => res.json())
      .then((products) => {
        container.innerHTML = "";

        const gender = genderFilter.value.toLowerCase();
        const profile = profileFilter.value.toLowerCase();
        const maxPrice = parseFloat(priceFilter.value);

        const filtered = products.filter((p) => {
          const matchesGender = !gender || (p.gender || "").toLowerCase() === gender;
          const matchesProfile = !profile || (p.profile || p.tags || "").toLowerCase().includes(profile);
          const matchesPrice = isNaN(maxPrice) || parseFloat(p.price) <= maxPrice;
          return matchesGender && matchesProfile && matchesPrice;
        });

        if (filtered.length === 0) {
          container.innerHTML = `<p class="text-center w-100">Aucun produit trouvé.</p>`;
          return;
        }

        filtered.forEach((p) => {
          const card = document.createElement("div");
          card.className = "col-sm-6 col-md-4 col-lg-3";

          card.innerHTML = `
            <div class="product-card">
              <img src="${p.image}" alt="${p.title}">
              <div class="detail-box">
                <h6 class="title">${p.title}</h6>
                <p class="price">Prix : ${p.price}</p>
                <button
                  class="btn btn-sm btn-primary snipcart-add-item"
                  data-item-id="${p.id || p.title}"
                  data-item-name="${p.title}"
                  data-item-price="${p.price}"
                  data-item-url="/shop.html"
                  data-item-description="${p.description || 'Produit BestGift'}"
                  data-item-image="${p.image}"
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
