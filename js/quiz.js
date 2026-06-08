/**
 * quiz.js
 * ---------------------------------------------------------------------------
 * Logique interactive du quizz de compréhension.
 *
 * Responsabilités :
 *  - Navigation entre les slides (précédent / suivant / clavier)
 *  - Sélection des boutons-réponses
 *  - Affichage conditionnel du bloc "Précision" (si réponse = Oui)
 *  - Vérification des réponses et coloration (correct / incorrect)
 *  - Révélation de la réponse détaillée
 *
 * Structure HTML attendue pour chaque slide :
 *   <div class="quiz-slide [is-active]" id="qs-N">
 *     <div class="quiz-slide__case-title">...</div>
 *     <p class="quiz-slide__description">...</p>
 *
 *     <!-- Question principale (nécessité) -->
 *     <div class="quiz-question">
 *       <div class="quiz-question__label">Nécessité de l'IA</div>
 *       <div class="answer-group">
 *         <button class="answer-btn" data-quiz="N" data-question="necessity" data-correct="true">Oui</button>
 *         <button class="answer-btn" data-quiz="N" data-question="necessity" data-correct="false">Non</button>
 *       </div>
 *     </div>
 *
 *     <!-- Question de précision (conditionnelle) -->
 *     <div class="quiz-precision" id="qp-N">
 *       <div class="quiz-question">
 *         <div class="quiz-question__label quiz-question__label--precision">Précision nécessaire</div>
 *         <div class="answer-group">
 *           <button class="answer-btn" data-quiz="N" data-question="precision" data-correct="false">Moyenne</button>
 *           ...
 *         </div>
 *       </div>
 *     </div>
 *
 *     <button class="verify-btn" data-quiz="N">Vérifier</button>
 *     <div class="quiz-answer" id="qa-N">...</div>
 *
 *     <div class="quiz-nav">
 *       <span class="quiz-nav__counter">N / TOTAL</span>
 *       <div class="quiz-nav__buttons">
 *         <button class="btn btn--ghost" data-nav="prev">←</button>
 *         <button class="btn btn--cyan"  data-nav="next">→</button>
 *       </div>
 *     </div>
 *   </div>
 *
 * Ce module est appelé par router.js après le chargement de activite.html.
 * ---------------------------------------------------------------------------
 */


// --------------------------------------------------------------------------
// État interne du quiz
// --------------------------------------------------------------------------

/** Index de la slide courante (0-based) */
let currentSlide = 0;

/** Nombre total de slides */
let totalSlides = 0;

/** Tableau des éléments .quiz-slide */
let slides = [];


// --------------------------------------------------------------------------
// Point d'entrée
// --------------------------------------------------------------------------

/**
 * Initialise le quizz.
 * À appeler après injection du HTML de la page Activités dans le DOM.
 */
export function initQuiz() {
  slides = Array.from(document.querySelectorAll('.quiz-slide'));
  totalSlides = slides.length;
  if (totalSlides === 0) return;

  currentSlide = 0;
  showSlide(0);

  // Délégation de clic pour toute la zone du quiz
  const quizWrap = document.querySelector('.quiz-wrap');
  if (!quizWrap) return;

  quizWrap.addEventListener('click', onQuizClick);

  // Navigation clavier (flèches)
  document.addEventListener('keydown', onKeydown);
}


// --------------------------------------------------------------------------
// Navigation entre slides
// --------------------------------------------------------------------------

/**
 * Affiche la slide à l'index donné.
 *
 * @param {number} index - Index cible (0-based)
 */
function showSlide(index) {
  // Borner l'index
  index = Math.max(0, Math.min(totalSlides - 1, index));

  slides.forEach((slide, i) => {
    slide.classList.toggle('is-active', i === index);
  });

  currentSlide = index;
}

/**
 * Avance ou recule d'un pas.
 *
 * @param {number} direction - +1 (suivant) ou -1 (précédent)
 */
function navigate(direction) {
  showSlide(currentSlide + direction);
}

/**
 * Gestion des touches clavier (flèches gauche/droite).
 *
 * @param {KeyboardEvent} e
 */
function onKeydown(e) {
  // Ne pas interférer avec les inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.key === 'ArrowRight') navigate(+1);
  if (e.key === 'ArrowLeft')  navigate(-1);
}


// --------------------------------------------------------------------------
// Gestionnaire de clic principal (délégation)
// --------------------------------------------------------------------------

/**
 * Gestionnaire central pour tous les clics dans .quiz-wrap.
 * Identifie le type d'élément cliqué et dispatche vers le bon handler.
 *
 * @param {MouseEvent} e
 */
function onQuizClick(e) {
  const target = e.target;

  // Bouton de navigation (précédent / suivant)
  if (target.closest('[data-nav]')) {
    const nav = target.closest('[data-nav]').dataset.nav;
    navigate(nav === 'next' ? +1 : -1);
    return;
  }

  // Bouton de réponse
  if (target.classList.contains('answer-btn')) {
    onAnswerClick(target);
    return;
  }

  // Bouton Vérifier
  if (target.classList.contains('verify-btn') || target.closest('.verify-btn')) {
    const btn = target.closest('.verify-btn');
    onVerifyClick(btn);
    return;
  }
}


// --------------------------------------------------------------------------
// Sélection d'une réponse
// --------------------------------------------------------------------------

/**
 * Gère le clic sur un bouton-réponse.
 *
 * @param {HTMLButtonElement} btn
 */
function onAnswerClick(btn) {
  const quizId   = btn.dataset.quiz;
  const question = btn.dataset.question; // 'necessity' ou 'precision'

  // Déselectionner les autres boutons du même groupe de questions
  const group = btn.closest('.answer-group');
  if (group) {
    group.querySelectorAll('.answer-btn').forEach(b => {
      b.classList.remove('is-selected', 'is-correct', 'is-wrong');
    });
  }

  btn.classList.add('is-selected');

  // Afficher/masquer la question de précision selon la réponse à la nécessité
  if (question === 'necessity') {
    togglePrecisionBlock(quizId, btn.dataset.correct === 'true');
  }

  // Réinitialiser l'état de vérification (l'utilisateur change sa réponse)
  resetVerificationState(quizId);
}


// --------------------------------------------------------------------------
// Affichage conditionnel du bloc "Précision"
// --------------------------------------------------------------------------

/**
 * Affiche ou masque le bloc de question de précision.
 *
 * @param {string}  quizId  - Identifiant de la slide (ex : "1")
 * @param {boolean} show    - Afficher si true, masquer si false
 */
function togglePrecisionBlock(quizId, show) {
  const precisionBlock = document.getElementById(`qp-${quizId}`);
  if (!precisionBlock) return;

  precisionBlock.classList.toggle('is-visible', show);

  // Si on masque, désélectionner les réponses de précision
  if (!show) {
    precisionBlock.querySelectorAll('.answer-btn').forEach(b => {
      b.classList.remove('is-selected', 'is-correct', 'is-wrong');
    });
  }
}


// --------------------------------------------------------------------------
// Vérification
// --------------------------------------------------------------------------

/**
 * Gère le clic sur le bouton "Vérifier".
 *
 * @param {HTMLButtonElement} verifyBtn
 */
function onVerifyClick(verifyBtn) {
  const quizId = verifyBtn.dataset.quiz;
  const slide  = document.getElementById(`qs-${quizId}`);
  if (!slide) return;

  const state = verifyBtn.dataset.state || 'verify';

  if (state === 'verify') {
    // Étape 1 : vérifier que tout est rempli
    if (!allQuestionsAnswered(slide, quizId)) return;

    // Colorer les boutons
    colorAnswers(slide);

    // Passer en état "reveal"
    verifyBtn.dataset.state = 'reveal';
    verifyBtn.innerHTML = '<i class="ti ti-eye"></i> Afficher la réponse';

  } else {
    // Étape 2 : afficher/masquer la réponse détaillée
    toggleAnswerReveal(quizId, verifyBtn);
  }
}

/**
 * Vérifie que toutes les questions visibles ont une réponse sélectionnée.
 * Applique une animation de secousse sur les groupes sans réponse.
 *
 * @param {HTMLElement} slide
 * @param {string}      quizId
 * @returns {boolean}
 */
function allQuestionsAnswered(slide, quizId) {
  let allAnswered = true;

  // Question de nécessité (toujours visible)
  const necessityGroup = slide.querySelector('[data-question="necessity"]')?.closest('.answer-group');
  if (necessityGroup && !necessityGroup.querySelector('.is-selected')) {
    shakeGroup(necessityGroup);
    allAnswered = false;
  }

  // Question de précision (visible seulement si "Oui" a été sélectionné)
  const precisionBlock = document.getElementById(`qp-${quizId}`);
  if (precisionBlock && precisionBlock.classList.contains('is-visible')) {
    const precisionGroup = precisionBlock.querySelector('.answer-group');
    if (precisionGroup && !precisionGroup.querySelector('.is-selected')) {
      shakeGroup(precisionGroup);
      allAnswered = false;
    }
  }

  return allAnswered;
}

/**
 * Colore tous les boutons sélectionnés selon leur exactitude.
 *
 * @param {HTMLElement} slide
 */
function colorAnswers(slide) {
  slide.querySelectorAll('.answer-btn.is-selected').forEach(btn => {
    btn.classList.remove('is-selected');
    btn.classList.add(btn.dataset.correct === 'true' ? 'is-correct' : 'is-wrong');
  });
}

/**
 * Affiche ou masque le bloc de réponse détaillée.
 * Met à jour le libellé du bouton Vérifier en conséquence.
 *
 * @param {string}          quizId
 * @param {HTMLButtonElement} verifyBtn
 */
function toggleAnswerReveal(quizId, verifyBtn) {
  const answerEl = document.getElementById(`qa-${quizId}`);
  if (!answerEl) return;

  const isNowVisible = !answerEl.classList.contains('is-visible');
  answerEl.classList.toggle('is-visible', isNowVisible);

  verifyBtn.innerHTML = isNowVisible
    ? '<i class="ti ti-eye-off"></i> Masquer la réponse'
    : '<i class="ti ti-eye"></i> Afficher la réponse';
}

/**
 * Réinitialise l'état de vérification quand l'utilisateur change sa réponse.
 * Masque la réponse révélée et réinitialise le libellé du bouton.
 *
 * @param {string} quizId
 */
function resetVerificationState(quizId) {
  const answerEl  = document.getElementById(`qa-${quizId}`);
  const verifyBtn = document.querySelector(`.verify-btn[data-quiz="${quizId}"]`);
  const slide     = document.getElementById(`qs-${quizId}`);

  if (answerEl) answerEl.classList.remove('is-visible');

  if (verifyBtn) {
    verifyBtn.innerHTML = '<i class="ti ti-check"></i> Vérifier';
    verifyBtn.dataset.state = 'verify';
  }

  // Remettre les boutons colorés en is-selected
  // pour que allQuestionsAnswered les reconnaisse
  if (slide) {
    slide.querySelectorAll('.answer-btn.is-correct, .answer-btn.is-wrong').forEach(btn => {
      btn.classList.remove('is-correct', 'is-wrong');
      btn.classList.add('is-selected');
    });
  }
}


// --------------------------------------------------------------------------
// Helpers UI
// --------------------------------------------------------------------------

/**
 * Applique une animation de secousse sur tous les boutons d'un groupe.
 *
 * @param {HTMLElement} group - Élément .answer-group
 */
function shakeGroup(group) {
  group.querySelectorAll('.answer-btn').forEach(btn => {
    btn.classList.add('is-shaking');
    btn.addEventListener('animationend', () => btn.classList.remove('is-shaking'), { once: true });
  });
}
