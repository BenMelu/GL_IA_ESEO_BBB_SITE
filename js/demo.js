/**
 * demo.js
 * ---------------------------------------------------------------------------
 * Logique des démonstrations IA.
 *
 * Responsabilités :
 *  - Gestion de l'upload d'image (clic + drag & drop) pour D2 et D3
 *  - Envoi de l'image au serveur Flask (POST /process?ml=N)
 *  - Affichage du résultat (entité, confiance, barre animée)
 *  - Gestion du formulaire Titanic (D1)
 *
 * URL du serveur :
 *   Les requêtes sont envoyées à API_BASE_URL définie ci-dessous.
 *   Modifier cette constante pour pointer vers votre serveur de production.
 *
 * Ce module est appelé par router.js après le chargement de demo.html.
 * ---------------------------------------------------------------------------
 */


// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------

/** URL de base de l'API Flask */
const API_BASE_URL = 'http://localhost:5000';


// --------------------------------------------------------------------------
// Point d'entrée
// --------------------------------------------------------------------------

/**
 * Initialise tous les modules de la page Démonstrations.
 * Appelé par router.js après injection de demo.html dans le DOM.
 */
export function initDemo() {
  initDemoD1(); // Titanic
  initDemoD2(); // Chats / Chiens
  initDemoD3(); // Mathématiques (chiffres)
}


// --------------------------------------------------------------------------
// D1 — Titanic (formulaire de régression)
// --------------------------------------------------------------------------

function initDemoD1() {
  const form = document.getElementById('form-titanic');
  if (!form) return;

  // Bloquer la touche "e" dans les champs numériques (évite "1e5" etc.)
  form.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'e' || e.key === 'E') e.preventDefault();
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateTitanicForm(form)) return;

    setStatus('d1', 'loading', 'Calcul en cours…');

    try {
      const response = await fetch(`${API_BASE_URL}/process?ml=1`, {
        method: 'POST',
        body: new FormData(form),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      displaySurvivalResult(data.tauxSurvie);
      setStatus('d1', 'ok', `Résultat calculé — taux de survie : ${data.tauxSurvie} %`);

    } catch (err) {
      console.error('[demo/D1] Erreur serveur :', err);
      setStatus('d1', 'error', 'Impossible de joindre le serveur.');
    }
  });
}

/**
 * Valide que tous les champs du formulaire Titanic sont remplis.
 * Applique une animation de secousse sur les champs vides.
 *
 * @param {HTMLFormElement} form
 * @returns {boolean} true si le formulaire est valide
 */
function validateTitanicForm(form) {
  let isValid = true;

  // Champs numériques
  form.querySelectorAll('input[type="number"]').forEach(input => {
    if (input.value === '') {
      shakeElement(input);
      isValid = false;
    }
  });

  // Groupes de boutons radio
  ['Pclass', 'Sex', 'Embarked'].forEach(name => {
    if (!form.querySelector(`input[name="${name}"]:checked`)) {
      form.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
        shakeElement(radio.closest('.radio-label'));
      });
      isValid = false;
    }
  });

  return isValid;
}

/**
 * Affiche le résultat du taux de survie.
 *
 * @param {number} value - Taux de survie en pourcentage
 */
function displaySurvivalResult(value) {
  const resultEl  = document.getElementById('survival-result');
  const valueEl   = document.getElementById('survival-value');
  if (!resultEl || !valueEl) return;

  valueEl.textContent = value;
  resultEl.classList.add('is-lit');
}


// --------------------------------------------------------------------------
// D2 — Classification chats / chiens
// --------------------------------------------------------------------------

function initDemoD2() {
  initImageDemo({
    demoId:       'd2',
    fileInputId:  'd2-file',
    dropZoneId:   'd2-dropzone',
    filenameId:   'd2-filename',
    sendBtnId:    'd2-send',
    previewId:    'd2-preview',
    errorId:      'd2-error',
    resultCardId: 'd2-result',
    entityId:     'd2-entity',
    confValueId:  'd2-conf-value',
    confBarId:    'd2-conf-bar',
    apiParam:     2,
  });
}


// --------------------------------------------------------------------------
// D3 — Classification de chiffres manuscrits
// --------------------------------------------------------------------------

function initDemoD3() {
  initImageDemo({
    demoId:       'd3',
    fileInputId:  'd3-file',
    dropZoneId:   'd3-dropzone',
    filenameId:   'd3-filename',
    sendBtnId:    'd3-send',
    previewId:    'd3-preview',
    errorId:      'd3-error',
    resultCardId: 'd3-result',
    entityId:     'd3-entity',
    confValueId:  'd3-conf-value',
    confBarId:    'd3-conf-bar',
    apiParam:     3,
  });
}


// --------------------------------------------------------------------------
// Fonction générique pour les démos avec upload d'image
// --------------------------------------------------------------------------

/**
 * Initialise une démo d'upload d'image.
 *
 * @param {object} config - Identifiants des éléments DOM et paramètre API
 */
function initImageDemo(config) {
  const fileInput = document.getElementById(config.fileInputId);
  const dropZone  = document.getElementById(config.dropZoneId);
  const sendBtn   = document.getElementById(config.sendBtnId);

  if (!fileInput || !dropZone || !sendBtn) return;

  // -- Sélection via clic sur la zone de drop --
  dropZone.addEventListener('click', () => fileInput.click());

  // -- Sélection via l'input natif --
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) handleFileSelected(file, config);
  });

  // -- Drag & Drop --
  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('is-dragging');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('is-dragging');
  });

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('is-dragging');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelected(file, config);
    }
  });

  // -- Bouton d'envoi --
  sendBtn.addEventListener('click', () => sendImageToApi(config));
}

/**
 * Appelé quand un fichier est sélectionné (clic ou drop).
 * Met à jour l'UI et prépare le bouton d'envoi.
 *
 * @param {File}   file
 * @param {object} config
 */
function handleFileSelected(file, config) {
  // Afficher le nom du fichier
  const filenameEl = document.getElementById(config.filenameId);
  if (filenameEl) {
    filenameEl.textContent = `📎 ${file.name}`;
    filenameEl.classList.add('is-visible');
  }

  // Prévisualiser l'image
  const reader = new FileReader();
  reader.onload = ev => updatePreview(config.previewId, ev.target.result);
  reader.readAsDataURL(file);

  setStatus(config.demoId, 'ok', 'Image chargée — prête à être analysée');
  clearError(config.errorId);
}

/**
 * Envoie l'image sélectionnée au serveur et affiche le résultat.
 *
 * @param {object} config
 */
async function sendImageToApi(config) {
  const fileInput = document.getElementById(config.fileInputId);
  const file = fileInput?.files[0];

  if (!file) {
    showError(config.errorId, 'Veuillez téléverser une image.');
    return;
  }

  // État de chargement
  const sendBtn = document.getElementById(config.sendBtnId);
  if (sendBtn) sendBtn.disabled = true;
  showLoader(config.demoId);
  resetResult(config);
  setStatus(config.demoId, 'loading', 'Analyse en cours — traitement par le modèle…');

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/process?ml=${config.apiParam}`, {
      method: 'POST',
      body: formData,
    });

    hideLoader(config.demoId);
    if (sendBtn) sendBtn.disabled = false;

    if (!response.ok) {
      showError(config.errorId, `Erreur serveur (${response.status})`);
      setStatus(config.demoId, 'error', 'Erreur serveur.');
      return;
    }

    // Le serveur renvoie les métadonnées dans un header personnalisé
    const jsonHeader = response.headers.get('X-Process-Texts');
    const texts = jsonHeader ? JSON.parse(jsonHeader) : {};

    // Mettre à jour l'aperçu avec l'image annotée renvoyée par le serveur
    const blob = await response.blob();
    updatePreview(config.previewId, URL.createObjectURL(blob));

    // Afficher le résultat
    displayClassificationResult(config, texts.classe, parseInt(texts.precision, 10) || 0);
    setStatus(
      config.demoId,
      'ok',
      `Analyse terminée — ${texts.classe} détecté à ${texts.precision} % de confiance`
    );

  } catch (err) {
    hideLoader(config.demoId);
    if (sendBtn) sendBtn.disabled = false;
    showError(config.errorId, 'Impossible de joindre le serveur.');
    setStatus(config.demoId, 'error', 'Erreur de connexion.');
    console.error(`[demo/D${config.apiParam}] Erreur :`, err);
  }
}


// --------------------------------------------------------------------------
// Helpers UI
// --------------------------------------------------------------------------

/**
 * Met à jour la zone de prévisualisation avec une image.
 *
 * @param {string} previewId - ID de l'élément .preview-box
 * @param {string} src       - URL ou data-URL de l'image
 */
function updatePreview(previewId, src) {
  const box = document.getElementById(previewId);
  if (!box) return;
  box.innerHTML = `
    <div class="preview-box__scanline"></div>
    <img class="preview-box__image" src="${src}" alt="Aperçu de l'image analysée">
  `;
}

/**
 * Affiche le résultat de classification dans la carte résultat.
 *
 * @param {object} config
 * @param {string} entity     - Entité détectée (ex : "CHAT")
 * @param {number} confidence - Confiance en %
 */
function displayClassificationResult(config, entity, confidence) {
  const card      = document.getElementById(config.resultCardId);
  const entityEl  = document.getElementById(config.entityId);
  const confValEl = document.getElementById(config.confValueId);
  const confBar   = document.getElementById(config.confBarId);

  if (entityEl)  entityEl.textContent  = entity || '—';
  if (confValEl) confValEl.textContent = `${confidence} %`;

  if (confBar) {
    // Petit délai pour déclencher la transition CSS
    setTimeout(() => {
      confBar.style.width = `${confidence}%`;
    }, 50);
  }

  if (card) card.classList.add('is-lit');
}

/**
 * Réinitialise l'affichage du résultat (avant un nouvel envoi).
 *
 * @param {object} config
 */
function resetResult(config) {
  const card      = document.getElementById(config.resultCardId);
  const entityEl  = document.getElementById(config.entityId);
  const confValEl = document.getElementById(config.confValueId);
  const confBar   = document.getElementById(config.confBarId);

  if (card)      card.classList.remove('is-lit');
  if (entityEl)  entityEl.textContent  = '—';
  if (confValEl) confValEl.textContent = '— %';
  if (confBar)   confBar.style.width   = '0';
}

/**
 * Met à jour la barre de statut d'une démo.
 *
 * @param {string} demoId - Identifiant de la démo ('d1', 'd2', 'd3')
 * @param {'ok'|'loading'|'error'} type
 * @param {string} message
 */
function setStatus(demoId, type, message) {
  const dot = document.getElementById(`${demoId}-status-dot`);
  const txt = document.getElementById(`${demoId}-status-text`);

  if (dot) {
    dot.className = 'status-bar__dot';
    if (type === 'ok')      dot.classList.add('status-bar__dot--ok');
    if (type === 'loading') dot.classList.add('status-bar__dot--loading');
    if (type === 'error')   dot.classList.add('status-bar__dot--error');
  }

  if (txt) txt.textContent = message;
}

/** Affiche le loader pour une démo donnée */
function showLoader(demoId) {
  const loader = document.getElementById(`${demoId}-loader`);
  if (loader) loader.classList.add('is-visible');
}

/** Masque le loader pour une démo donnée */
function hideLoader(demoId) {
  const loader = document.getElementById(`${demoId}-loader`);
  if (loader) loader.classList.remove('is-visible');
}

/** Affiche un message d'erreur */
function showError(errorId, message) {
  const el = document.getElementById(errorId);
  if (el) el.textContent = message;
}

/** Efface le message d'erreur */
function clearError(errorId) {
  const el = document.getElementById(errorId);
  if (el) el.textContent = '';
}

/**
 * Applique une animation de secousse sur un élément.
 *
 * @param {HTMLElement} el
 */
function shakeElement(el) {
  if (!el) return;
  el.classList.add('is-shaking');
  el.addEventListener('animationend', () => el.classList.remove('is-shaking'), { once: true });
}
