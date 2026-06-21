/**
 * themes.js
 * ---------------------------------------------------------------------------
 * Gestion du thème clair / sombre.
 *
 * Responsabilités :
 *  - Lire la préférence sauvegardée (localStorage) ou système (prefers-color-scheme)
 *  - Appliquer le thème en ajoutant/retirant la classe .theme-dark sur <html>
 *  - Mettre à jour l'icône du bouton (soleil = clair, lune = sombre)
 *  - Sauvegarder le choix de l'utilisateur dans localStorage
 *
 * Le CSS réagit à la classe .theme-dark sur <html> via les variables CSS
 * déjà définies dans variables.css avec @media (prefers-color-scheme: dark).
 * Il faut dupliquer ce bloc en [data-theme="dark"] pour que le JS puisse
 * forcer le thème indépendamment du système.
 * ---------------------------------------------------------------------------
 */

const STORAGE_KEY = 'eseia-theme';
const DARK_CLASS  = 'theme-dark';

/**
 * Retourne le thème actif : 'dark' ou 'light'.
 * Priorité : localStorage > préférence système.
 */
function getPreferredTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Applique le thème sur <html> et met à jour l'icône du bouton.
 *
 * @param {'dark'|'light'} theme
 */
function applyTheme(theme) {
  const root = document.documentElement;
  const btn  = document.getElementById('theme-toggle');

  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }

  if (btn) {
    const icon = btn.querySelector('i');
    if (icon) {
      // Soleil affiché quand le thème clair est actif (pour basculer vers sombre)
      // Lune affichée quand le thème sombre est actif (pour basculer vers clair)
      icon.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
    }
    btn.setAttribute('aria-label', theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre');
  }
}

/**
 * Bascule entre thème clair et sombre, sauvegarde le choix.
 */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next    = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(STORAGE_KEY, next);
  applyTheme(next);
}

/**
 * Initialise le système de thème.
 * À appeler une seule fois au chargement (depuis main.js).
 */
export function initTheme() {
  // Appliquer immédiatement le bon thème (avant le premier rendu)
  applyTheme(getPreferredTheme());

  // Attacher le listener sur le bouton
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);

  // Réagir aux changements de préférence système (si l'utilisateur n'a pas
  // fait de choix manuel)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}