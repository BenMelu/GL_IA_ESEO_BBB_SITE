/**
 * router.js
 * ---------------------------------------------------------------------------
 * Gestion de la navigation single-page.
 *
 * Responsabilités :
 *  - Charger le HTML de chaque page dans #page-container via fetch()
 *  - Mettre à jour l'URL (hash) et les boutons de navigation actifs
 *  - Mémoriser les pages déjà chargées pour éviter les requêtes inutiles
 *  - Appeler les initialiseurs de modules après chaque chargement de page
 *
 * Pages disponibles (dossier /pages/) :
 *  - propos.html   → Page d'accueil / À propos
 *  - info.html     → Qu'est-ce que l'IA ?
 *  - demo.html     → Démonstrations
 *  - activite.html → Activités
 * ---------------------------------------------------------------------------
 */

import { initTabs }  from './tabs.js';
import { initDemo }  from './demo.js';
import { initQuiz }  from './quiz.js';

// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------

/**
 * Map des pages disponibles.
 * Clé : identifiant de page (= data-page sur les boutons nav, = hash URL)
 * Valeur : chemin vers le fichier HTML partiel
 */
const PAGES = {
  propos:   'pages/propos.html',
  info:     'pages/info.html',
  demo:     'pages/demo.html',
  activite: 'pages/activite.html',
};

/** Page affichée par défaut si aucun hash n'est présent dans l'URL */
const DEFAULT_PAGE = 'propos';


// --------------------------------------------------------------------------
// État interne
// --------------------------------------------------------------------------

/** Cache des pages déjà chargées : { pageId: htmlString } */
const pageCache = {};

/** Identifiant de la page courante */
let currentPage = null;


// --------------------------------------------------------------------------
// Fonctions principales
// --------------------------------------------------------------------------

/**
 * Charge et affiche une page.
 *
 * @param {string} pageId - Identifiant de la page (clé de PAGES)
 * @param {boolean} [pushState=true] - Mettre à jour le hash de l'URL
 */
async function navigateTo(pageId, pushState = true) {
  if (!PAGES[pageId]) {
    pageId = DEFAULT_PAGE;
  }

  if (pageId === currentPage) return;

  const html = await loadPage(pageId);
  if (!html) return;

  const container = document.getElementById('page-container');

  // Masquer pendant le chargement
  container.style.visibility = 'hidden';

  container.innerHTML = html;
  updateNavButtons(pageId);

  if (pushState) {
    history.replaceState(null, '', `#${pageId}`);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Initialiser les modules (dont initTabs qui règle les sous-onglets)
  initPageModules(pageId);

  // Révéler une fois tout prêt
  container.style.visibility = 'visible';

  currentPage = pageId;
}

/**
 * Charge le HTML d'une page (depuis cache ou fetch).
 *
 * @param {string} pageId
 * @returns {Promise<string|null>} HTML de la page, ou null en cas d'erreur
 */
async function loadPage(pageId) {
  if (pageCache[pageId]) {
    return pageCache[pageId];
  }

  try {
    const response = await fetch(PAGES[pageId]);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} pour ${PAGES[pageId]}`);
    }
    const html = await response.text();
    pageCache[pageId] = html;
    return html;
  } catch (err) {
    console.error(`[router] Impossible de charger la page "${pageId}" :`, err);
    return null;
  }
}

/**
 * Met à jour l'état actif des boutons de navigation principale.
 *
 * @param {string} activePageId
 */
function updateNavButtons(activePageId) {
  document.querySelectorAll('.main-nav__btn').forEach(btn => {
    const isActive = btn.dataset.page === activePageId;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

/**
 * Initialise les modules JS nécessaires après le chargement d'une page.
 * Ajouter ici les appels d'init pour chaque page qui a un comportement JS.
 *
 * @param {string} pageId
 */
function initPageModules(pageId) {
  // Sous-onglets (présents sur demo.html et activite.html)
  initTabs();

  switch (pageId) {
    case 'demo':
      initDemo();
      break;
    case 'activite':
      initQuiz();
      break;
  }
}


// --------------------------------------------------------------------------
// Gestion du bouton retour / navigation navigateur
// --------------------------------------------------------------------------

/**
 * Répond aux changements de hash (bouton retour, liens #)
 */
function onHashChange() {
  const hash = window.location.hash.slice(1) || DEFAULT_PAGE;
  // Extraire seulement l'id de page (avant un éventuel ":")
  const pageId = hash.split(':')[0];
  navigateTo(pageId, false);
}


// --------------------------------------------------------------------------
// Point d'entrée
// --------------------------------------------------------------------------

/**
 * Initialise le routeur.
 * À appeler une seule fois, au chargement de la page (DOMContentLoaded).
 */
export function initRouter() {
  // Délégation de clic sur les boutons de navigation
  document.querySelectorAll('.main-nav__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo(btn.dataset.page);
    });
  });

  // Écouter les changements de hash (retour navigateur)
  window.addEventListener('hashchange', onHashChange);

  // Charger la page initiale (depuis le hash ou la page par défaut)
  onHashChange();
}

// Export pour usage dans d'autres modules (ex : liens inter-pages)
export { navigateTo };
