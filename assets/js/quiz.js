document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none"; // Masquer le loader à l'ouverture
  updateDoubleRange();
});

// --- Configuration ---
const USE_ALL_MERCHANTS = true;

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
  loader.style.display = "flex";

  if (!form.gender.value || !form.interests.value) {
    let missingField = '';
    if (!form.gender.value) {
      missingField = 'genre';
      document.getElementById('step-gender').scrollIntoView({ behavior: 'smooth' });
    } else if (!form.interests.value) {
      missingField = 'profil';
      document.getElementById('step-profile').scrollIntoView({ behavior: 'smooth' });
    }
    alert(`Merci de renseigner votre ${missingField}`);
    loader.style.display = "none";
    return;
  }

  let topMerchants = [];
  let maybeMerchants = [];

  if (USE_ALL_MERCHANTS) {
    topMerchants = ["eBay", "SportDecouverte", "EasyGift", "BookVillage"];
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
