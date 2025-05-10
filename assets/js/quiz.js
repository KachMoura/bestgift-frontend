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

const form = document.getElementById("quizForm");
const suggestionsContainer = document.getElementById("suggestionsContainer");
const loader = document.getElementById("loader");
const messageBox = document.getElementById("messageBox");

const apiBaseUrl = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"
  : "https://bestgift-backend.onrender.com";

form.addEventListener("submit", function (e) {
  e.preventDefault();
  suggestionsContainer.innerHTML = "";
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
    budget: parseFloat(form.budget.value),
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
          <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.title}">
          <h3>${product.title}</h3>
          <p><strong>${product.price} €</strong></p>
          <a href="${product.link}" target="_blank">Acheter</a>
        `;
        carousel.appendChild(card);
      });

      section.appendChild(carousel);
      suggestionsContainer.appendChild(section);
    }
  });

  if (!anyProductFound) {
    messageBox.textContent = "Aucun cadeau ne correspond à vos critères pour le moment.";
  }
}

function updateBudgetOutput(val) {
  const output = document.getElementById("budgetOutput");
  output.innerHTML = `<strong>${val} €</strong>`;
}

document.getElementById("resetBtn").addEventListener("click", function () {
  document.getElementById("quizForm").reset();

  const zones = ["topMerchants", "maybeMerchants", "avoidMerchants", "merchantPool"];
  zones.forEach(zoneId => {
    const zone = document.getElementById(zoneId);
    if (zone) zone.innerHTML = "";
  });

  const marchands = ["eBay", "AliExpress", "Rakuten", "Decathlon", "Catalogue EasyGift", "Fake Store"];
  const pool = document.getElementById("merchantPool");
  marchands.forEach(id => {
    const li = document.createElement("li");
    li.id = id;
    li.draggable = true;
    li.textContent = id;
    li.addEventListener("dragstart", drag);
    pool.appendChild(li);
  });

  document.getElementById("budgetOutput").innerHTML = "<strong>30 €</strong>";
  document.getElementById("budget").value = 30;
});