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
 *  - Gérer les clics sur les cartes data-nav-page (page propos.html)
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
 * @param {string}  pageId    - Identifiant de la page (clé de PAGES)
 * @param {boolean} [pushState=true] - Mettre à jour le hash de l'URL
 */
async function navigateTo(pageId, pushState = true) {
  if (!PAGES[pageId]) {
    console.warn(`[router] Page inconnue : "${pageId}". Redirection vers "${DEFAULT_PAGE}".`);
    pageId = DEFAULT_PAGE;
  }

  // Éviter de recharger la page déjà affichée
  if (pageId === currentPage) return;

  // 1. Charger le HTML (depuis le cache ou via fetch)
  const html = await loadPage(pageId);
  if (!html) return;

  const container = document.getElementById('page-container');

  // 2. Désactiver les animations le temps que initTabs règle les sous-onglets
  //    (évite le flash du premier sous-onglet avant activation du bon)
  container.classList.add('no-animate');

  // 3. Injecter dans le conteneur principal
  container.innerHTML = html;

  // 4. Mettre à jour les boutons de navigation principale
  updateNavButtons(pageId);

  // 5. Mettre à jour le hash URL
  if (pushState) {
    history.replaceState(null, '', `#${pageId}`);
  }

  // 6. Remonter en haut de la page
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 7. Initialiser les modules (dont initTabs qui active le bon sous-onglet)
  initPageModules(pageId);

  // 8. Forcer un reflow puis réactiver les animations
  container.offsetHeight;
  container.classList.remove('no-animate');

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
    case 'propos':
      initProposNav();
      break;
  }
}


// --------------------------------------------------------------------------
// Navigation depuis les cartes de propos.html
// --------------------------------------------------------------------------

/**
 * Attache les listeners de clic sur les cartes [data-nav-page].
 * Ces cartes sont présentes dans propos.html et permettent de naviguer
 * vers info, demo ou activite en cliquant sur les trois cartes d'accueil.
 *
 * Appelé par initPageModules après chaque chargement de propos.html.
 */
function initProposNav() {
  const container = document.getElementById('page-container');
  if (!container) return;

  container.querySelectorAll('[data-nav-page]').forEach(card => {
    card.addEventListener('click', () => {
      const targetPage   = card.dataset.navPage;
      const targetSubtab = card.dataset.navSubtab;
      if (!targetPage) return;

      // Naviguer vers la page, puis activer le sous-onglet si précisé
      navigateTo(targetPage).then(() => {
        if (targetSubtab) {
          const btn = document.querySelector(`.subtabs-bar__btn[data-subtab="${targetSubtab}"]`);
          if (btn) btn.click();
        }
      });
    });
  });
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
  // Délégation de clic sur les boutons de navigation principale
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

// Masquer le splash screen à la fin du premier chargement
if (!currentPage) {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    // Attendre 2s puis fade de 1s
    setTimeout(() => {
      splash.classList.add('is-hidden');
    }, 2000);
  }
}