/**
 * tabs.js
 * ---------------------------------------------------------------------------
 * Gestion des sous-onglets (subtabs) et du header masqué au scroll.
 *
 * Responsabilités :
 *  - Activer/désactiver les sous-pages (demo : d1/d2/d3, activite : a1/a2/a3/a4)
 *  - Masquer le header lors d'un scroll vers le bas, le réafficher vers le haut
 *
 * Ce module est appelé par router.js après chaque chargement de page.
 * Il opère sur le DOM fraîchement injecté dans #page-container.
 * ---------------------------------------------------------------------------
 */


// --------------------------------------------------------------------------
// Header — masquage au scroll
// --------------------------------------------------------------------------

/** Référence à la dernière position Y connue du scroll */
let lastScrollY = 0;

/**
 * Attache le comportement de masquage du header.
 * Appelé une seule fois (depuis main.js), car le header est dans index.html.
 */
export function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;

    // Scroll vers le bas (> 8px) → masquer
    if (delta > 8) {
      header.classList.add('is-hidden');
    }
    // Scroll vers le haut (> 8px) → afficher
    else if (delta < -8) {
      header.classList.remove('is-hidden');
    }

    lastScrollY = currentY;
  }, { passive: true });
}


// --------------------------------------------------------------------------
// Sous-onglets
// --------------------------------------------------------------------------

/**
 * Initialise les sous-onglets présents dans la page courante.
 *
 * Structure HTML attendue :
 *   <div class="subtabs-bar">
 *     <div class="subtabs-bar__inner">
 *       <button class="subtabs-bar__btn is-active" data-subtab="d2">...</button>
 *       ...
 *     </div>
 *   </div>
 *   <div class="subpage is-active" id="d2">...</div>
 *   <div class="subpage" id="d1">...</div>
 *
 * Plusieurs barres de sous-onglets peuvent coexister dans la même page
 * (ex : la page demo et la page activite n'en ont qu'une chacune).
 */
export function initTabs() {
  const subtabBars = document.querySelectorAll('.subtabs-bar');

  subtabBars.forEach(bar => {
    const buttons = bar.querySelectorAll('.subtabs-bar__btn');
    const scope = bar.closest('.page') || document;

    // Retirer tous les is-active existants du HTML
    buttons.forEach(b => b.classList.remove('is-active'));
    scope.querySelectorAll('.subpage').forEach(sp => sp.classList.remove('is-active'));

    // Lire le hash pour savoir quel sous-onglet activer
    const hash = window.location.hash.slice(1);
    const subtabId = hash.split(':')[1];
    const targetBtn = subtabId
      ? bar.querySelector(`[data-subtab="${subtabId}"]`)
      : bar.querySelector('.subtabs-bar__btn'); // premier par défaut

    if (targetBtn) {
      targetBtn.classList.add('is-active');
      const target = scope.querySelector(`#${targetBtn.dataset.subtab}`);
      if (target) target.classList.add('is-active');
    }

    // Attacher les listeners
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.subtab;

        buttons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        scope.querySelectorAll('.subpage').forEach(sp => sp.classList.remove('is-active'));

        const target = scope.querySelector(`#${targetId}`);
        if (target) target.classList.add('is-active');

        const pageId = window.location.hash.slice(1).split(':')[0];
        history.replaceState(null, '', `#${pageId}:${targetId}`);
      });
    });
  });
}