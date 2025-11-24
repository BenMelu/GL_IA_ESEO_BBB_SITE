const fileIn = document.getElementById("fileInput");
const preview= document.getElementById("fileInit");

fileIn.addEventListener("change", () => {
    const file = fileIn.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        preview.classList.add("visible");
        preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
});


async function sendImage() {
    const file = fileIn.files[0];
    if (!file) return alert("Choisissez une image");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5000/process", {
        method: "POST",
        body: formData
    });

    if (!res.ok) {
        alert("Erreur serveur");
        return;
    }

    const jsonHeader = res.headers.get("X-Process-Texts");
    if (!jsonHeader) {
        console.error("Header X-Process-Texts manquant !");
        return;
    }
    console.log("Header brut =", jsonHeader);
    let texts;
    try {
        texts = JSON.parse(jsonHeader);
    } catch (e) {
        console.error("Impossible de parser le JSON :", jsonHeader);
        return;
    }
    console.log("Objet JSON =", texts);  // ← Vérification

    // ---- ACCÈS AUX CHAMPS ----
    console.log("classe =", texts.classe);
    console.log("precision =", texts.precision);

    const blob = await res.blob();
    document.getElementById("resultCl").textContent=texts.classe;
    document.getElementById("resultPr").textContent=texts.precision;
    document.getElementById("resultIMG").src = URL.createObjectURL(blob);
    
}

/* Onglets principaux */
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
        document.getElementById(btn.dataset.tab).style.display = "block";
    });
});

/* Sous-onglets (géré globalement) */
document.querySelectorAll(".subtab-btn").forEach(btn => {
    btn.addEventListener("click", () => {

        const parent = btn.closest(".tab-content");

        parent.querySelectorAll(".subtab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        parent.querySelectorAll(".subtab-content").forEach(c => c.style.display = "none");
        parent.querySelector("#" + btn.dataset.subtab).style.display = "block";
    });
});