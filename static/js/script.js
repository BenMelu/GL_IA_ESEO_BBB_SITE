

document.querySelectorAll('.image-upload').forEach(input => {
    input.addEventListener('change', function () {
        const file = this.files[0];
        const previewId = this.dataset.preview;
        const preview = document.getElementById(previewId);
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            preview.classList.add("visible");
            preview.src = e.target.result;
        }
        reader.readAsDataURL(file);

    });
});

document.getElementById("answerD1").addEventListener("submit", async function(e) {
    e.preventDefault();
    let formData = new FormData(this);
    lienRes = "https://bbbiaatelier-447946806594.europe-west1.run.app/process?ml=1";
    const res =await fetch(lienRes, {
        method: "POST",
        body: formData
    });
    console.log(res)
    if (!res.ok) {
        alert("Erreur serveur");
        return;
    }
    texts=await res.json();
    document.getElementById("resultTaD1").textContent = texts.tauxSurvie;
});

async function sendImage(onglet) {
    let fileIn;
    switch(onglet){
        case 2:
            fileIn = document.getElementById("fileInputD2");
            break;
        case 3:
            fileIn = document.getElementById("fileInputD3");   
            break;
    }
    const file = fileIn.files[0];
    if (!file) return alert("Choisissez une image");

    const formData = new FormData();
    formData.append("file", file);
    let lienRes;
    console.log(onglet);
    if (onglet !== 2 && onglet !== 3) {
        alert("Mauvais onglet detecté");
        return;
    }
    switch (onglet) {
        case 2:
            lienRes = "https://bbbiaatelier-447946806594.europe-west1.run.app/process?ml=2";
            break;
        case 3:
            lienRes = "https://bbbiaatelier-447946806594.europe-west1.run.app/process?ml=3";
            break;
    }
    const res = await fetch(lienRes, {
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
    let texts;
    try {
        texts = JSON.parse(jsonHeader);
    } catch (e) {
        console.error("Impossible de parser le JSON :", jsonHeader);
        return;
    }
    const blob = await res.blob();
    switch (onglet) {
        case 2:
            document.getElementById("resultClD2").textContent = texts.classe;
            document.getElementById("resultPrD2").textContent = texts.precision;
            document.getElementById("resultIMGD2").src = URL.createObjectURL(blob);
            break;
        case 3:
            document.getElementById("resultClD3").textContent = texts.classe;
            document.getElementById("resultPrD3").textContent = texts.precision;
            document.getElementById("resultIMGD3").src = URL.createObjectURL(blob);
            break;
    }
    return;
}

/*const socket = io();

    socket.on("video_frame", function(data) {
      const blob = new Blob([data], { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      document.getElementById("fluVideoCam").src = url;
    });*/

/* Onglets principaux */
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        document.getElementById(btn.dataset.tab).classList.add("active");
    });
});

/* Sous-onglets */
document.querySelectorAll(".subtab-btn").forEach(btn => {
    btn.addEventListener("click", () => {

        const parent = btn.closest(".tab-content");

        parent.querySelectorAll(".subtab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        parent.querySelectorAll(".subtab-content").forEach(c => c.classList.remove("active"));
        parent.querySelector("#" + btn.dataset.subtab).classList.add("active");
    });
});

/*Réponses aux parties compréhension*/
document.querySelectorAll(".comp-answ-btn").forEach(btn => {
    btn.addEventListener("click", () => {

        const target = document.getElementById(btn.dataset.hiddendiv);
        btn.classList.toggle("active");
        target.classList.toggle("visible");
    });
});