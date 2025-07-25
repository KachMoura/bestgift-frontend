document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
  updateDoubleRange();
  showStep(currentStep);
});

// Étapes du formulaire
let currentStep = 0;
const steps = document.querySelectorAll(".form-step");
const nextBtn = document.getElementById("nextStep");
const prevBtn = document.getElementById("prevStep");
const submitBtn = document.getElementById("submitBtn");

function showStep(step) {
  steps.forEach((el, index) => {
    el.classList.toggle("active", index === step);
  });
  prevBtn.style.display = step > 0 ? "inline-block" : "none";
  nextBtn.style.display = step < steps.length - 1 ? "inline-block" : "none";
  submitBtn.style.display = step === steps.length - 1 ? "inline-block" : "none";
}

nextBtn.addEventListener("click", () => {
  if (currentStep < steps.length - 1) currentStep++;
  showStep(currentStep);
});
prevBtn.addEventListener("click", () => {
  if (currentStep > 0) currentStep--;
  showStep(currentStep);
});

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

// --- Form submission ---
const form = document.getElementById("quizForm");
const suggestionsContainer = document.getElementById("suggestionsContainer");
const loader = document.getElementById("loader");
const messageBox = document.getElementById("messageBox");

form.addEventListener("submit", function (e) {
  e.preventDefault();
  suggestionsContainer.innerHTML = "";
  messageBox.textContent = "";
  loader.style.display = "block";

  if (!form.gender.value || !form.interests.value) {
    alert("Merci de renseigner le genre et le profil.");
    loader.style.display = "none";
    return;
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
    preferences
  };

  fetch("/api/suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(result => {
      loader.style.display = "none";
      if (!result || !result.suggestions || Object.keys(result.suggestions).length === 0) {
        messageBox.textContent = "Aucun cadeau ne correspond à vos critères pour le moment.";
        return;
      }
      displaySuggestions(result.suggestions);
    })
    .catch(err => {
      loader.style.display = "none";
      messageBox.textContent = "Une erreur est survenue.";
      console.error(err);
    });
});

function displaySuggestions(suggestions) {
  suggestionsContainer.innerHTML = "";
  for (const merchant in suggestions) {
    const group = suggestions[merchant];
    if (!group.length) continue;
    const section = document.createElement("div");
    section.className = "merchant-section";
    const title = document.createElement("h2");
    title.textContent = `Suggestions ${merchant}`;
    section.appendChild(title);
    const carousel = document.createElement("div");
    carousel.className = "card-carousel";
    group.forEach(product => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="score-badge">Matching : ${Math.round(product.matchingScore || 30)}%</div>
        <img src="${product.image}" alt="${product.title}">
        <h3>${product.title}</h3>
        <p><strong>${product.price} €</strong></p>
        <a href="${product.link}" target="_blank">Consulter</a>
      `;
      carousel.appendChild(card);
    });
    section.appendChild(carousel);
    suggestionsContainer.appendChild(section);
  }
}