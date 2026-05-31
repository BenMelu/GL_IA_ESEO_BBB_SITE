

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

/*Réponses aux questions du quizz*/
document.querySelectorAll(".answer-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const quiz = btn.closest('.quiz');
        const slide = btn.closest('.quiz-slide');
        const compBtn = slide.querySelector('.comp-answ-btn');
        const precisionDiv = slide.querySelectorAll('.quiz')[1];

        quiz.querySelectorAll('.answer-btn').forEach(b => {
            b.classList.remove('selected');
            b.style.background = '';
            b.style.borderColor = '';
            b.style.color = '';
        });

        btn.classList.add('selected');

        // Affiche ou cache la précision selon la réponse à la pertinence
        if (quiz === slide.querySelectorAll('.quiz')[0]) {
            if (btn.dataset.correct === 'true') {
                precisionDiv.classList.add('visible');
            } else {
                precisionDiv.classList.remove('visible');
                precisionDiv.querySelectorAll('.answer-btn').forEach(b => {
                    b.classList.remove('selected');
                    b.style.background = '';
                    b.style.borderColor = '';
                    b.style.color = '';
                });
            }
        }

        if (compBtn.dataset.state === 'reveal') {
            compBtn.textContent = 'Vérifier →';
            compBtn.dataset.state = 'verify';
            const target = document.getElementById(compBtn.dataset.hiddendiv);
            target.classList.remove('visible');
            compBtn.classList.remove('active');
        }
    });
});

document.querySelectorAll(".comp-answ-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const slide = btn.closest('.quiz-slide');
        const quizzes = slide.querySelectorAll('.quiz');
        const state = btn.dataset.state;

        if (state === 'verify') {
            let allAnswered = true;
            quizzes.forEach(quiz => {
                const isHidden = quiz.classList.contains('quiz-precision') && !quiz.classList.contains('visible');
                if (!isHidden && !quiz.querySelector('.answer-btn.selected')) {
                    allAnswered = false;
                    quiz.querySelectorAll('.answer-btn').forEach(b => {
                        b.classList.add('shake');
                        setTimeout(() => b.classList.remove('shake'), 300);
                    });
                }
            });

            if (!allAnswered) return;

            quizzes.forEach(quiz => {
                quiz.querySelectorAll('.answer-btn').forEach(b => {
                    if (b.classList.contains('selected')) {
                        if (b.dataset.correct === 'true') {
                            b.style.background = '#d4edda';
                            b.style.borderColor = '#28a745';
                            b.style.color = '#28a745';
                        } else {
                            b.style.background = '#f8d7da';
                            b.style.borderColor = '#dc3545';
                            b.style.color = '#dc3545';
                        }
                    }
                });
            });

            btn.textContent = 'Afficher la réponse →';
            btn.dataset.state = 'reveal';

        } else if (state === 'reveal') {
            const target = document.getElementById(btn.dataset.hiddendiv);
            btn.classList.toggle("active");
            target.classList.toggle("visible");
        }
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

// fading du quizz
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const intro = document.getElementById('quiz-intro');
    const questions = document.getElementById('quiz-questions');

    if (intro && questions) {
        if (scrollY > 300) {
            intro.style.opacity = '0';
            intro.style.pointerEvents = 'none';
        } else {
            intro.style.opacity = '1';
            intro.style.pointerEvents = 'auto';
        }

        if (scrollY > 700) {
            questions.style.opacity = '1';
        } else {
            questions.style.opacity = '0';
        }
    }
});

// Js pour les questions du quizz
let currentSlide = 0;
const slides = document.querySelectorAll('.quiz-slide');
const counter = document.getElementById('quiz-counter');

function showSlide(n) {
    const current = slides[currentSlide];
    current.style.opacity = '0';
    
    setTimeout(() => {
        slides.forEach(s => s.classList.remove('active'));
        currentSlide = (n + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        slides[currentSlide].style.opacity = '0';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                slides[currentSlide].style.opacity = '1';
            });
        });
        counter.textContent = (currentSlide + 1) + ' / ' + slides.length;
    }, 400);
}

document.getElementById('quiz-next').addEventListener('click', () => showSlide(currentSlide + 1));
document.getElementById('quiz-prev').addEventListener('click', () => showSlide(currentSlide - 1));

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') showSlide(currentSlide + 1);
    if (e.key === 'ArrowLeft') showSlide(currentSlide - 1);
});

showSlide(0);

// Boutons du quizz
document.querySelectorAll(".answer-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const quiz = btn.closest('.quiz');
        quiz.querySelectorAll('.answer-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});