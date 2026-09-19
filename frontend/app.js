const API = "http://localhost:8000";

const TYPES = ["Chemise", "T-shirt", "Pull", "Robe", "Pantalon", "Jean", "Jupe", "Veste", "Manteau", "Short", "Sweat", "Autre"];
const ETATS = ["Neuf avec étiquette", "Neuf sans étiquette", "Très bon état", "Bon état", "Satisfaisant"];

let articleId = null;

function fillSelect(select, values) {
  select.innerHTML = "";
  for (const v of values) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  }
}

fillSelect(document.getElementById("type-select"), TYPES);
fillSelect(document.getElementById("etat-select"), ETATS);

async function loadReferences() {
  const res = await fetch(`${API}/api/references`);
  const data = await res.json();
  const refSelect = document.getElementById("reference-select");
  const bgSelect = document.getElementById("background-select");
  fillSelect(refSelect, data.references);
  for (const name of data.references) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    bgSelect.appendChild(opt);
  }
}
loadReferences();

document.getElementById("btn-create-article").addEventListener("click", async () => {
  const input = document.getElementById("photos-input");
  if (!input.files.length) return;
  const form = new FormData();
  for (const f of input.files) form.append("photos", f);
  const res = await fetch(`${API}/api/articles`, { method: "POST", body: form });
  const data = await res.json();
  articleId = data.id;
  document.getElementById("article-status").textContent = `Article ${articleId} créé (${data.nb_photos} photos).`;
  document.getElementById("step-images").classList.remove("disabled");
  document.getElementById("step-info").classList.remove("disabled");
});

document.getElementById("btn-tryon").addEventListener("click", async () => {
  const referenceName = document.getElementById("reference-select").value;
  const form = new FormData();
  form.append("reference_name", referenceName);
  const res = await fetch(`${API}/api/articles/${articleId}/generate-tryon`, { method: "POST", body: form });
  if (!res.ok) return alert("Échec génération mannequin : " + (await res.text()));
  const data = await res.json();
  addPreview(data.path);
});

document.getElementById("btn-flatlay").addEventListener("click", async () => {
  const bg = document.getElementById("background-select").value;
  const form = new FormData();
  if (bg) form.append("background_reference_name", bg);
  const res = await fetch(`${API}/api/articles/${articleId}/generate-flatlay`, { method: "POST", body: form });
  if (!res.ok) return alert("Échec génération photo pliée : " + (await res.text()));
  const data = await res.json();
  addPreview(data.path);
});

function addPreview(relativePath) {
  const img = document.createElement("img");
  img.src = `${API}/data/articles/${articleId}/${relativePath}`;
  document.getElementById("generated-preview").appendChild(img);
}

document.getElementById("btn-recognize").addEventListener("click", async () => {
  const res = await fetch(`${API}/api/articles/${articleId}/recognize`, { method: "POST" });
  if (!res.ok) return alert("Échec reconnaissance : " + (await res.text()));
  const data = await res.json();
  if (data.marque) document.getElementById("marque-input").value = data.marque;
  if (data.type) document.getElementById("type-select").value = data.type;
  if (data.couleur) document.getElementById("couleur-input").value = data.couleur;
  if (data.matiere) document.getElementById("matiere-input").value = data.matiere;
});

document.getElementById("btn-generate-listing").addEventListener("click", async () => {
  const form = new FormData();
  form.append("type", document.getElementById("type-select").value);
  form.append("marque", document.getElementById("marque-input").value);
  form.append("couleur", document.getElementById("couleur-input").value);
  form.append("taille", document.getElementById("taille-input").value);
  form.append("etat", document.getElementById("etat-select").value);
  form.append("matiere", document.getElementById("matiere-input").value);
  form.append("prix_achat", document.getElementById("prix-achat-input").value);
  form.append("utiliser_prix_marche", document.getElementById("marche-checkbox").checked);

  const res = await fetch(`${API}/api/articles/${articleId}/listing`, { method: "POST", body: form });
  if (!res.ok) return alert("Échec génération annonce : " + (await res.text()));
  const data = await res.json();
  document.getElementById("result-titre").textContent = data.listing.titre;
  document.getElementById("result-description").textContent = data.listing.description;
  document.getElementById("result-prix").textContent = `Prix conseillé : ${data.price.prix_conseille} € — ${data.price.detail}`;
  document.getElementById("step-result").classList.remove("disabled");
});

document.getElementById("btn-export").addEventListener("click", () => {
  window.location.href = `${API}/api/articles/${articleId}/export`;
});
