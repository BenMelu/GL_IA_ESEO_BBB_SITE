/**
 * main.js
 * ---------------------------------------------------------------------------
 * Point d'entrée JavaScript de l'application ESE'IA.
 *
 * Ce fichier est le seul chargé directement par index.html (type="module").
 * Il importe et initialise les modules dans le bon ordre.
 *
 * Ordre d'initialisation :
 *   1. initHeaderScroll()  — comportement du header au scroll (layout stable)
 *   2. initRouter()        — chargement des pages et navigation (doit venir après)
 *
 * Les modules demo.js et quiz.js sont initialisés par router.js
 * après chaque chargement de page, pas ici.
 * ---------------------------------------------------------------------------
 */

import { initRouter }       from './router.js';
import { initHeaderScroll } from './tabs.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Comportement du header (masquage au scroll vers le bas)
  initHeaderScroll();

  // 2. Routeur single-page (chargement des pages, navigation)
  initRouter();
});
