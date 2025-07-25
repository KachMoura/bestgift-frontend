document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("quizForm");
  const steps = document.querySelectorAll(".quiz-step");
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  const submitBtn = document.getElementById("submitBtn");
  let currentStep = 0;

  function showStep(index) {
    steps.forEach((step, i) => {
      step.classList.toggle("active", i === index);
    });
    prevBtn.disabled = index === 0;
    nextBtn.style.display = index === steps.length - 1 ? "none" : "inline-block";
    submitBtn.style.display = index === steps.length - 1 ? "inline-block" : "none";
  }

  function validateStep(index) {
    const step = steps[index];
    const inputs = step.querySelectorAll("input, select");
    let valid = true;
    for (let input of inputs) {
      if (input.hasAttribute("required") && !input.value) {
        valid = false;
        break;
      }
    }
    return valid;
  }

  nextBtn.addEventListener("click", () => {
    if (!validateStep(currentStep)) {
      alert("Veuillez remplir tous les champs requis.");
      return;
    }
    currentStep++;
    showStep(currentStep);
  });

  prevBtn.addEventListener("click", () => {
    currentStep--;
    showStep(currentStep);
  });

  showStep(currentStep);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    alert("Formulaire soumis avec succès !");
    // Ici, tu peux intégrer l'appel à l'API ou ta logique existante
  });
});