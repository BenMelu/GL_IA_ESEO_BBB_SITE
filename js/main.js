/**
 * main.js
 * ---------------------------------------------------------------------------
 * Point d'entrée JavaScript de l'application ESE'IA.
 *
 * Ce fichier est le seul chargé directement par index.html (type="module").
 * Il importe et initialise les modules dans le bon ordre.
 *
 * Ordre d'initialisation :
 *   1. initTheme()         — thème clair/sombre (avant le rendu)
 *   2. initHeaderScroll()  — comportement du header au scroll
 *   3. initRouter()        — chargement des pages et navigation
 *
 * Les modules demo.js et quiz.js sont initialisés par router.js
 * après chaque chargement de page, pas ici.
 * ---------------------------------------------------------------------------
 */

import { initRouter }       from './router.js';
import { initHeaderScroll } from './tabs.js';
import { initTheme }        from './themes.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Thème (doit être appliqué avant tout rendu)
  initTheme();

  // 2. Comportement du header (masquage au scroll vers le bas)
  initHeaderScroll();

  // 3. Routeur single-page (chargement des pages, navigation)
  initRouter();
});