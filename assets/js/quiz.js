// ... (toutes les fonctions existantes restent inchangées jusqu’à compareBtn)

function markdownToHTMLTable(lines) {
  const rows = lines
    .filter(line => line.includes('|') && !line.includes('---'))
    .map(line => line.trim().split('|').slice(1, -1).map(cell => cell.trim()));
  if (rows.length === 0) return "<p>(Aucune donnée tabulaire trouvée)</p>";
  const headers = rows[0];
  const bodyRows = rows.slice(1);
  return `
    <table class="ai-table">
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${bodyRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  `;
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
          ${markdownToHTMLTable(tableLines)}
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
