document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none"; // Masquer le loader à l'ouverture
});
// --- Configuration ---
const USE_ALL_MERCHANTS = true; // 🔁 Remets sur false pour réactiver le drag & drop plus tard


// --- Drag & drop merchants ---
function allowDrop(ev) {
  ev.preventDefault();
}
function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}
function drop(ev) {
  ev.preventDefault();
  const data = ev.dataTransfer.getData("text");
  const element = document.getElementById(data);
  if (element && ev.target.tagName === "UL") {
    ev.target.appendChild(element);
  }
}
function getMerchantList(id) {
  return Array.from(document.querySelectorAll(`#${id} li`)).map(li => li.id);
}

// --- Budget sliders ---
function updateDoubleRange() {
  const minSlider = document.getElementById("minBudget");
  const maxSlider = document.getElementById("maxBudget");
  const minOutput = document.getElementById("minBudgetOutput");
  const maxOutput = document.getElementById("maxBudgetOutput");
  const track = document.getElementById("rangeTrack");
  let minVal = parseInt(minSlider.value);
  let maxVal = parseInt(maxSlider.value);
  if (minVal > maxVal) {
    [minVal, maxVal] = [maxVal, minVal];
    minSlider.value = minVal;
    maxSlider.value = maxVal;
  }
  minOutput.textContent = `${minVal}€`;
  maxOutput.textContent = `${maxVal}€`;
  const percentMin = (minVal / 500) * 100;
  const percentMax = (maxVal / 500) * 100;
  track.style.left = `${percentMin}%`;
  track.style.width = `${percentMax - percentMin}%`;
}

// --- Main logic ---
const form = document.getElementById("quizForm");
const suggestionsContainer = document.getElementById("suggestionsContainer");
const loader = document.getElementById("loader");
const messageBox = document.getElementById("messageBox");
const compareSection = document.getElementById("compareSection");
const compareList = document.getElementById("compareList");
const compareBtn = document.getElementById("compareBtn");
const aiResultBox = document.getElementById("aiComparisonResult");

const apiBaseUrl = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"
  : "https://bestgift-backend.onrender.com";

let selectedProductsForCompare = [];

form.addEventListener("submit", function (e) {
  e.preventDefault();
  
  suggestionsContainer.innerHTML = "";
  aiResultBox.innerHTML = "";
  compareList.innerHTML = "";
  selectedProductsForCompare = [];
  compareSection.style.display = "none";
  messageBox.textContent = "";
  loader.style.display = "block";


  // Vérifie si le genre ou le profil sont non sélectionnés
  if (!form.gender.value || !form.interests.value) {
    let missingField = '';

    // Détermine quel champ est manquant
    if (!form.gender.value) {
      missingField = 'genre';
      document.getElementById('step-gender').scrollIntoView({ behavior: 'smooth' }); // Scroll jusqu'au champ genre
    } else if (!form.interests.value) {
      missingField = 'profil';
      document.getElementById('step-profile').scrollIntoView({ behavior: 'smooth' }); // Scroll jusqu'au champ profil
    }

    // Affiche la pop-up de message
    alert(`Merci de renseigner votre ${missingField}`);

    return; // Arrête le processus si un champ est manquant
  }

  let topMerchants = [];
  let maybeMerchants = [];


  



  if (USE_ALL_MERCHANTS) {
    topMerchants = ["eBay", "SportDecouverte", "EasyGift", "BookVillage"];
    maybeMerchants = [];
  } else {
    topMerchants = getMerchantList("topMerchants");
    maybeMerchants = getMerchantList("maybeMerchants");
    if (topMerchants.length === 0 && maybeMerchants.length === 0) {
      loader.style.display = "none";
      messageBox.textContent = "Veuillez sélectionner au moins un marchand.";
      return;
    }
  }

  const preferences = Array.from(document.querySelectorAll('input[name="preferences"]:checked')).map(el => el.value);
  const minBudget = parseFloat(document.getElementById("minBudget").value);
  const maxBudget = parseFloat(document.getElementById("maxBudget").value);

  const data = {
    interests: [form.interests.value],
    minBudget,
    budget: maxBudget,
    excludedGifts: form.excludedGifts.value.split(',').map(i => i.trim()).filter(Boolean),
    gender: form.gender.value,
    preferences: preferences,
    merchants: {
      top: topMerchants,
      maybe: maybeMerchants
    }
  };

  fetch(`${apiBaseUrl}/api/suggestions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": "test_pub_key_123456"
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(result => {
      loader.style.display = "none";
      const hasSuggestions = result?.suggestions && Object.keys(result.suggestions).length > 0;

      // Cas spécial : profil lecteur → forcer l'affichage de BookVillage si dispo
      if (data.interests.includes("book") && result.suggestions?.BookVillage?.length > 0) {
        data.merchants.top = [...new Set([...(data.merchants.top || []), "BookVillage"])];
      }

      if (!hasSuggestions) {
        messageBox.textContent = "Aucun cadeau ne correspond à vos critères pour le moment.";
        return;
      }

      displaySuggestionsByMerchant(result.suggestions, data.merchants);

      setTimeout(() => {
        document.getElementById("suggestionsContainer").scrollIntoView({ behavior: "smooth" });
      }, 300);
    })
    .catch(err => {
      loader.style.display = "none";
      messageBox.textContent = "Une erreur est survenue. Veuillez réessayer.";
      console.error("Erreur lors de la requête :", err);
    });
});


// --- Affichage des suggestions ---
function displaySuggestionsByMerchant(suggestions, merchantRanking) {
  suggestionsContainer.innerHTML = "";
  const order = [...merchantRanking.top, ...merchantRanking.maybe];
  let anyProductFound = false;

  order.forEach(merchant => {
    const products = suggestions[merchant];
    if (products && products.length > 0) {
      anyProductFound = true;
      const section = document.createElement("div");
      section.className = "merchant-section";

      const title = document.createElement("h2");
      const merchantName = merchant === "EasyGift" ? "Catalogue BestGift" : merchant;
      title.textContent = `Suggestions ${merchantName}`;
      section.appendChild(title);

      const carousel = document.createElement("div");
      carousel.className = "card-carousel";

      products.forEach(product => {
        const score = product.matchingScore || 30;
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <div class="score-badge">Matching : ${Math.round(score)}%</div>
          <img src="${product.image}" alt="${product.title}">
          <h3>${product.title}</h3>
          <p><strong>${product.price} €</strong></p>
          <a href="${product.link}" target="_blank">Consulter</a><br>
          <button class="btn btn-sm btn-outline-primary mt-2 compare-btn">Comparer</button>
        `;
        card.dataset.title = product.title;
        card.dataset.link = product.link;
        card.dataset.image = product.image;
        card.dataset.price = product.price;
        card.dataset.description = product.description || "";
        card.querySelector(".compare-btn").addEventListener("click", () => handleCompareClick(card));
        carousel.appendChild(card);
      });

      section.appendChild(carousel);
      suggestionsContainer.appendChild(section);
    }
  });

  if (!anyProductFound) {
    messageBox.textContent = "Aucun cadeau ne correspond à vos critères.";
  }
}

// --- Comparaison produits ---
function handleCompareClick(card) {
  if (selectedProductsForCompare.length >= 2) {
    alert("Vous ne pouvez comparer que 2 produits. Cliquez sur réinitialiser si besoin");
    return;
  }
  compareSection.style.display = "block";
  card.classList.add("selected");
  selectedProductsForCompare.push({
    title: card.dataset.title,
    price: card.dataset.price,
    image: card.dataset.image,
    link: card.dataset.link,
    description: card.dataset.description || ""
  });
  const miniCard = document.createElement("div");
  miniCard.className = "compare-mini-card";
  miniCard.innerHTML = `
    <img src="${card.dataset.image}" alt="${card.dataset.title}" />
    <div>
      <strong>${card.dataset.title}</strong><br>
      ${card.dataset.price} €
    </div>
  `;
  compareList.appendChild(miniCard);
  if (selectedProductsForCompare.length === 2) {
    compareBtn.disabled = false;
    setTimeout(() => {
      document.getElementById("compareSection").scrollIntoView({ behavior: "smooth" });
    }, 200);
  }
}

// --- Analyse IA ---
compareBtn.addEventListener("click", async () => {
  compareBtn.disabled = true;
  aiResultBox.innerHTML = `<p style="color:#3498db">Analyse en cours (Plusieurs secondes...)</p>`;
  try {
    const response = await fetch(`${apiBaseUrl}/api/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: selectedProductsForCompare })
    });
    const result = await response.json();
    if (result.analysis) {
      const lines = result.analysis.split('\n');
      const tableLines = [];
      const recommendationLines = [];
      let inReco = false;
      for (const line of lines) {
        if (
          line.toLowerCase().includes("je vous recommande") ||
          line.toLowerCase().includes("si vous cherchez") ||
          line.toLowerCase().includes("en revanche") ||
          line.toLowerCase().includes("meilleur choix")
        ) {
          inReco = true;
        }
        if (inReco) recommendationLines.push(line);
        else tableLines.push(line);
      }
      const headers = tableLines[0]?.split('|').slice(1, -1).map(cell => cell.trim()) || [];
      const rows = tableLines.slice(1).map(line =>
        line.split('|').slice(1, -1).map(cell => cell.trim())
      );
      aiResultBox.innerHTML = `
        <div class="ai-analysis-box">
          <h4>Comparaison détaillée</h4>
          <table class="ai-table">
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>
              ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="ai-reco-box">
          <h5>Recommandation IA</h5>
          <p>${recommendationLines.join('<br>')}</p>
        </div>
      `;
      aiResultBox.scrollIntoView({ behavior: "smooth" });
    } else {
      aiResultBox.innerHTML = `<p style="color:#e74c3c">Erreur lors de l'analyse.</p>`;
    }
  } catch (e) {
    aiResultBox.innerHTML = `<p style="color:#e74c3c">Erreur : ${e.message}</p>`;
  }
});

// --- Réinitialisation ---
document.getElementById("resetCompareBtn").addEventListener("click", function () {
  selectedProductsForCompare = [];
  compareList.innerHTML = "";
  compareSection.style.display = "none";
  compareBtn.disabled = true;
  document.querySelectorAll(".card.selected").forEach(card => {
    card.classList.remove("selected");
  });
});

document.getElementById("resetBtn").addEventListener("click", function () {
  document.getElementById("quizForm").reset();
  document.getElementById("minBudgetOutput").textContent = "0 €";
  document.getElementById("maxBudgetOutput").textContent = "100 €";
  document.getElementById("minBudget").value = 0;
  document.getElementById("maxBudget").value = 100;
  const zones = ["topMerchants", "maybeMerchants", "avoidMerchants", "merchantPool"];
  zones.forEach(zoneId => {
    const zone = document.getElementById(zoneId);
    if (zone) zone.innerHTML = "";
  });
  const marchands = ["eBay", "Catalogue BestGift", "BookVillage", "SportDecouverte"];
  const pool = document.getElementById("merchantPool");
  if (pool) {
    marchands.forEach(id => {
      const li = document.createElement("li");
      li.id = id;
      li.draggable = true;
      li.textContent = id;
      li.addEventListener("dragstart", drag);
      pool.appendChild(li);
    });
  }
  suggestionsContainer.innerHTML = "";
  messageBox.textContent = "";
  aiResultBox.innerHTML = "";
  compareList.innerHTML = "";
  compareSection.style.display = "none";
  selectedProductsForCompare = [];
  compareBtn.disabled = true;
});

document.addEventListener("DOMContentLoaded", function () {
  updateDoubleRange();
});
