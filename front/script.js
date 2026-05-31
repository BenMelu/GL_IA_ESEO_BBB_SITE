

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
    lienRes = "http://localhost:5000/process?ml=1";
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


// message d'alerte si l'utilisateur envoie une image vide
if (!file) {
    document.getElementById("erreurD" + onglet).textContent = "Veuillez choisir une image.";
    return;
}
document.getElementById("erreurD" + onglet).textContent = "";



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
            lienRes = "http://localhost:5000/process?ml=2";
            break;
        case 3:
            lienRes = "http://localhost:5000/process?ml=3";
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


// Permet de ne pas changer d'onglet quand on recharge la page

function getActiveTab() {
  const hash = window.location.hash.slice(1);
  const [tab, subtab] = hash.split(':');
  return { tab: tab || 'propos', subtab: subtab || null };
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === tabName);
  });

  updateHash(tabName, null);
}

function switchSubtab(tabName, subtabName) {
  // Ne touche qu'aux sous-onglets du bon onglet parent
  const parent = document.getElementById(tabName);
  if (!parent) return;

  parent.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.subtab === subtabName);
  });

  parent.querySelectorAll('.subtab-content').forEach(content => {
    content.classList.toggle('active', content.id === subtabName);
  });

  updateHash(tabName, subtabName);
}

function updateHash(tabName, subtabName) {
  const hash = subtabName ? `${tabName}:${subtabName}` : tabName;
  history.replaceState(null, '', '#' + hash);
}

// Au chargement
const { tab, subtab } = getActiveTab();
switchTab(tab);
if (subtab) switchSubtab(tab, subtab);

// Clics sur les onglets principaux
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Clics sur les sous-onglets
document.querySelectorAll('.subtab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const parent = btn.closest('.tab-content');
    switchSubtab(parent.id, btn.dataset.subtab);
  });
});

let lastScroll = 0;

window.addEventListener('scroll', () => {
    const current = window.scrollY;
    const diff = current - lastScroll;

    if (diff < -5) {
        // scroll vers le haut d'au moins 10px → header visible
        document.querySelector('header').style.opacity = '1';
        document.querySelector('header').style.transform = 'translateY(0)';
    } else if (diff > 5) {
        // scroll vers le bas d'au moins 10px → header caché
        document.querySelector('header').style.opacity = '0';
        document.querySelector('header').style.transform = 'translateY(-100%)';
    }

    lastScroll = current;
});

const header = document.querySelector('header');
document.body.style.paddingTop = header.offsetHeight + 'px';