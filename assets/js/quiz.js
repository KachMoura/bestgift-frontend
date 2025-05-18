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

function updateBudgetDisplay() {
  const minVal = parseInt(document.getElementById("minBudget").value);
  const maxVal = parseInt(document.getElementById("maxBudget").value);
  const minOutput = document.getElementById("minBudgetOutput");
  const maxOutput = document.getElementById("maxBudgetOutput");

  if (minVal > maxVal) {
    document.getElementById("minBudget").value = maxVal;
    document.getElementById("maxBudget").value = minVal;
    minOutput.textContent = maxVal + "€";
    maxOutput.textContent = minVal + "€";
  } else {
    minOutput.textContent = minVal + "€";
    maxOutput.textContent = maxVal + "€";
  }
}

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

  const topMerchants = getMerchantList("topMerchants");
  const maybeMerchants = getMerchantList("maybeMerchants");

  if (topMerchants.length === 0 && maybeMerchants.length === 0) {
    loader.style.display = "none";
    messageBox.textContent = "Veuillez sélectionner au moins un marchand.";
    return;
  }

  const preferences = Array.from(document.querySelectorAll('input[name="preferences"]:checked')).map(el => el.value);

  const data = {
    interests: [form.interests.value],
    minBudget: parseFloat(form.minBudget.value),
    budget: parseFloat(form.maxBudget.value),
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
      if (!hasSuggestions) {
        messageBox.textContent = "Aucun cadeau ne correspond à vos critères pour le moment.";
        return;
      }
      displaySuggestionsByMerchant(result.suggestions, data.merchants);
    })
    .catch(err => {
      loader.style.display = "none";
      messageBox.textContent = "Une erreur est survenue. Veuillez réessayer.";
      console.error("Erreur lors de la requête :", err);
    });
});

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

function handleCompareClick(card) {
  if (selectedProductsForCompare.length >= 2) {
    alert("Vous ne pouvez comparer que 2 produits.");
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
  }
}

compareBtn.addEventListener("click", async () => {
  compareBtn.disabled = true;
  aiResultBox.innerHTML = `<p style="color:#3498db">Analyse en cours...</p>`;
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

      aiResultBox.innerHTML = `
        <div class="ai-analysis-box">
          <h4>Comparaison détaillée</h4>
          <table class="ai-table">
            ${tableLines.map(l => `<tr><td>${l}</td></tr>`).join("")}
          </table>
        </div>
        <div class="ai-reco-box">
          <h5>Recommandation IA</h5>
          <p>${recommendationLines.join('<br>')}</p>
        </div>
      `;
    } else {
      aiResultBox.innerHTML = `<p style="color:#e74c3c">Erreur lors de l'analyse.</p>`;
    }
  } catch (e) {
    aiResultBox.innerHTML = `<p style="color:#e74c3c">Erreur : ${e.message}</p>`;
  }
});

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
  document.getElementById("maxBudgetOutput").textContent = "50 €";
  document.getElementById("minBudget").value = 0;
  document.getElementById("maxBudget").value = 50;

  const zones = ["topMerchants", "maybeMerchants", "avoidMerchants", "merchantPool"];
  zones.forEach(zoneId => {
    const zone = document.getElementById(zoneId);
    if (zone) zone.innerHTML = "";
  });

  const marchands = ["eBay", "AliExpress", "Rakuten", "Decathlon", "Catalogue BestGift", "Fake Store"];
  const pool = document.getElementById("merchantPool");
  marchands.forEach(id => {
    const li = document.createElement("li");
    li.id = id;
    li.draggable = true;
    li.textContent = id;
    li.addEventListener("dragstart", drag);
    pool.appendChild(li);
  });

  suggestionsContainer.innerHTML = "";
  messageBox.textContent = "";
  aiResultBox.innerHTML = "";
  compareList.innerHTML = "";
  compareSection.style.display = "none";
  selectedProductsForCompare = [];
  compareBtn.disabled = true;
});
