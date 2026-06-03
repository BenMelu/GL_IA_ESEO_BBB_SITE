# ESE'IA — Documentation développeur

Site web de présentation et de démonstration de l'intelligence artificielle.
Produit par l'école d'ingénieur **ESEO** dans le cadre d'un stage S7 (2025).

---

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure du projet](#2-structure-du-projet)
3. [Architecture technique](#3-architecture-technique)
4. [Lancer le projet](#4-lancer-le-projet)
5. [Guide CSS — design system](#5-guide-css--design-system)
6. [Guide JS — modules](#6-guide-js--modules)
7. [Ajouter une page](#7-ajouter-une-page)
8. [Ajouter un sous-onglet](#8-ajouter-un-sous-onglet)
9. [Connecter l'API Flask](#9-connecter-lapi-flask)
10. [Conventions de code](#10-conventions-de-code)
11. [Contacts et crédits](#11-contacts-et-crédits)

---

## 1. Vue d'ensemble

ESE'IA est un site **single-page** (SPA) sans framework.  
Le contenu de chaque page est chargé dynamiquement dans un conteneur via `fetch()`,
ce qui évite les rechargements complets tout en gardant une base de code simple
(HTML/CSS/JS vanilla, aucune dépendance npm).

**Pages disponibles :**

| Identifiant | Fichier              | Description                            |
|-------------|----------------------|----------------------------------------|
| `propos`    | `pages/propos.html`  | Accueil, présentation du site          |
| `info`      | `pages/info.html`    | Contenu éditorial sur l'IA             |
| `demo`      | `pages/demo.html`    | Démonstrations de modèles IA           |
| `activite`  | `pages/activite.html`| Activités pédagogiques guidées         |

---

## 2. Structure du projet

```
eseia/
│
├── index.html              Coquille principale (header + conteneur)
│
├── pages/                  Fragments HTML chargés dynamiquement
│   ├── propos.html         Page À propos
│   ├── info.html           Page Qu'est-ce que l'IA ?
│   ├── demo.html           Page Démonstrations (D1 Titanic, D2 Chats/Chiens, D3 Maths)
│   └── activite.html       Page Activités (A1 Quizz, A2 Chatbots, A3 VittaScience, A4 Kaggle)
│
├── css/
│   ├── base.css            Reset, variables CSS, typographie, utilitaires
│   ├── layout.css          Header, navigation, structure, footer, fond
│   ├── components.css      Cartes, badges, boutons, formulaires, hero, guide
│   ├── demo.css            Upload, preview, résultats, loader (démos IA)
│   ├── quiz.css            Slides, boutons-réponses, précision (quizz)
│   └── animations.css      Keyframes globaux, classes d'animation
│
├── js/
│   ├── main.js             Point d'entrée — importe et initialise les modules
│   ├── router.js           Chargement des pages, navigation par hash URL
│   ├── tabs.js             Sous-onglets + comportement header au scroll
│   ├── demo.js             Upload, drag & drop, appel API Flask, résultats
│   └── quiz.js             Navigation slides, vérification, réponses
│
└── assets/
    ├── favicon/            Icônes du site (apple-touch-icon, favicon…)
    ├── act2/               Images pour la page info (réseaux de neurones)
    ├── act3/               Captures d'écran pour l'activité VittaScience
    └── act4/               Captures d'écran pour l'activité Kaggle
```

---

## 3. Architecture technique

### Chargement des pages (router.js)

```
Clic bouton nav
      │
      ▼
navigateTo(pageId)
      │
      ├─ pageCache[pageId] existe ? → retourner le HTML en cache
      │
      └─ fetch(pages/<pageId>.html)
              │
              ▼
        Injecter dans #page-container
              │
              ▼
        initPageModules(pageId)
          ├─ initTabs()       (toujours)
          ├─ initDemo()       (si page = demo)
          └─ initQuiz()       (si page = activite)
```

### Navigation par hash URL

L'URL reflète toujours la page courante :

```
#propos             → page propos
#demo               → page demo, sous-onglet par défaut
#demo:d1            → page demo, sous-onglet Titanic
#activite:a3        → page activite, sous-onglet Entraînement
```

Le bouton retour du navigateur est géré via l'événement `hashchange`.

### Modules ES6

Tous les fichiers JS sont des **modules ES6** (`type="module"` dans index.html).
Les imports/exports sont explicites — aucune variable globale.

```
main.js
  ├── import { initRouter }       from './router.js'
  ├── import { initHeaderScroll } from './tabs.js'
  │
router.js
  ├── import { initTabs }  from './tabs.js'
  ├── import { initDemo }  from './demo.js'
  └── import { initQuiz }  from './quiz.js'
```

---

## 4. Lancer le projet

### Prérequis

Les modules ES6 et `fetch()` nécessitent un serveur HTTP local
(ils ne fonctionnent pas avec le protocole `file://`).

### Option A — Python (recommandé, sans installation)

```bash
# Dans le dossier eseia/
python3 -m http.server 8080
# Puis ouvrir : http://localhost:8080
```

### Option B — Node.js

```bash
npx serve .
# Puis ouvrir l'URL affichée dans le terminal
```

### Option C — Extension VS Code

Installer **Live Server** (Ritwick Dey) → clic droit sur `index.html` → *Open with Live Server*.

### Serveur Flask (API IA)

Les démonstrations D1, D2, D3 envoient des requêtes à un serveur Flask.  
L'URL est configurée dans `js/demo.js` :

```js
const API_BASE_URL = 'http://localhost:5000';
```

Voir la section [Connecter l'API Flask](#9-connecter-lapi-flask) pour le détail.

---

## 5. Guide CSS — design system

### Variables CSS (base.css)

Toutes les valeurs de design sont centralisées dans `:root` dans `base.css`.  
**Ne jamais coder de valeurs en dur dans les autres fichiers CSS.**

```css
/* Exemple d'utilisation */
.mon-element {
  color: var(--color-cyan);
  border: 1px solid var(--color-border-cyan);
  box-shadow: var(--glow-cyan);
}
```

**Variables principales :**

| Variable                  | Valeur           | Usage                          |
|---------------------------|------------------|--------------------------------|
| `--color-cyan`            | `#00e5ff`        | Accent principal               |
| `--color-magenta`         | `#ff1f8e`        | Accent secondaire              |
| `--color-purple`          | `#7b2fff`        | Accent tertiaire               |
| `--color-bg`              | `#03050e`        | Fond de page                   |
| `--color-text`            | `#c8e6ff`        | Texte principal                |
| `--color-text-muted`      | `#5a8ab0`        | Texte secondaire               |
| `--color-border-cyan`     | `rgba(…, 0.2)`   | Bordures accent principal      |
| `--glow-cyan`             | `0 0 22px …`     | Effet lumineux (box-shadow)    |
| `--radius-lg`             | `16px`           | Border-radius cartes           |
| `--header-height`         | `68px`           | Hauteur du header fixe         |

### Couleur accentuée pour un élément (variantes)

Chaque composant principal existe en 3 variantes de couleur :

```html
<!-- Cyan (défaut) -->
<div class="cyber-card"> … </div>

<!-- Magenta -->
<div class="cyber-card cyber-card--magenta"> … </div>

<!-- Purple -->
<div class="cyber-card cyber-card--purple"> … </div>
```

Idem pour `.badge`, `.result-card`, `.t-orbitron`.

### Quel fichier CSS modifier ?

| Besoin                                  | Fichier            |
|-----------------------------------------|--------------------|
| Changer une couleur globale             | `base.css`         |
| Modifier le header ou la navigation     | `layout.css`       |
| Modifier un bouton, une carte, un badge | `components.css`   |
| Modifier l'upload ou les résultats IA   | `demo.css`         |
| Modifier l'apparence du quizz           | `quiz.css`         |
| Ajouter une animation                   | `animations.css`   |

---

## 6. Guide JS — modules

### router.js

Gère la navigation. Modifier ici pour :

- **Ajouter une page** : ajouter une entrée dans l'objet `PAGES`
- **Changer la page par défaut** : modifier `DEFAULT_PAGE`
- **Initialiser un nouveau module** : ajouter un cas dans `initPageModules()`

### tabs.js

Gère les sous-onglets et le masquage du header.
`initTabs()` est appelé automatiquement à chaque chargement de page.
`initHeaderScroll()` est appelé une seule fois dans `main.js`.

### demo.js

Gère les trois démonstrations.

- `API_BASE_URL` : URL du serveur Flask (modifier pour la production)
- `initDemoD2()` et `initDemoD3()` : appellent `initImageDemo()` avec une config
- Pour **ajouter une nouvelle démo image** : copier la config de D2, changer les IDs et `apiParam`

### quiz.js

Gère le quizz interactif via **délégation d'événements** sur `.quiz-wrap`.
Pour ajouter une slide, ajouter le HTML correspondant dans `activite.html`
en suivant la convention d'IDs (`qs-N`, `qp-N`, `qa-N`).

---

## 7. Ajouter une page

### Étape 1 — Créer le fichier HTML

Créer `pages/ma-page.html` en suivant la structure des pages existantes :

```html
<div class="page is-active" id="page-ma-page">
  <div class="page-section">
    <!-- contenu -->
  </div>
</div>
```

### Étape 2 — Déclarer la page dans router.js

```js
const PAGES = {
  propos:   'pages/propos.html',
  info:     'pages/info.html',
  demo:     'pages/demo.html',
  activite: 'pages/activite.html',
  mapage:   'pages/ma-page.html',   // ← ajouter ici
};
```

### Étape 3 — Ajouter le bouton dans index.html

```html
<button class="main-nav__btn" data-page="mapage">
  Ma page
</button>
```

### Étape 4 — Initialiser un éventuel module JS

Dans `router.js`, ajouter un case dans `initPageModules()` :

```js
case 'mapage':
  initMonModule();
  break;
```

---

## 8. Ajouter un sous-onglet

### Dans le HTML de la page (ex : demo.html)

**1. Ajouter le bouton dans la barre :**

```html
<button class="subtabs-bar__btn" data-subtab="d4">Mon nouvel onglet</button>
```

**2. Ajouter le contenu :**

```html
<div class="subpage" id="d4">
  <div class="page-section">
    <!-- contenu -->
  </div>
</div>
```

`tabs.js` prend en charge automatiquement le nouveau bouton au prochain `initTabs()`.

---

## 9. Connecter l'API Flask

### URL de base

Dans `js/demo.js`, modifier :

```js
const API_BASE_URL = 'http://localhost:5000';
// Production : const API_BASE_URL = 'https://mon-serveur.com';
```

### Endpoints attendus

| Démo | Méthode | URL                        | Corps          | Réponse                              |
|------|---------|----------------------------|----------------|--------------------------------------|
| D1   | POST    | `/process?ml=1`            | FormData       | JSON `{ tauxSurvie: number }`        |
| D2   | POST    | `/process?ml=2`            | FormData (img) | Image blob + header `X-Process-Texts`|
| D3   | POST    | `/process?ml=3`            | FormData (img) | Image blob + header `X-Process-Texts`|

### Format du header `X-Process-Texts` (D2 et D3)

```json
{ "classe": "CHAT", "precision": "94" }
```

---

## 10. Conventions de code

### HTML

- **Pas de CSS inline**, sauf exception justifiée et commentée
- **Pas de JS inline** — aucun attribut `onclick`, `onchange`, etc.
- Utiliser des attributs `aria-*` pour l'accessibilité
- Indentation : **2 espaces**

### CSS

- Toutes les valeurs de design passent par les **variables CSS** de `base.css`
- Nommage des classes : **BEM** simplifié (`bloc__element--modificateur`)
- Un fichier CSS par domaine fonctionnel (ne pas mélanger layout et composants)
- Indentation : **2 espaces**

### JavaScript

- **Modules ES6** uniquement (`import` / `export`)
- **Aucune variable globale** — tout est encapsulé dans les modules
- Chaque module exporte une fonction `init*()` appelée par `router.js`
- Utiliser la **délégation d'événements** plutôt que des listeners individuels
- Commenter les fonctions avec **JSDoc** (`@param`, `@returns`)
- Indentation : **2 espaces**

---

## 11. Contacts et crédits

| Rôle                  | Nom                    | Contact                     |
|-----------------------|------------------------|-----------------------------|
| Développeur           | Ghyslain COUPLAN       | —                           |
| Développeur           | Lilian LEMERCIER       | —                           |
| Tuteur                | Bilel BEN BOUBAKER     | —                           |
| Activité Chatbots     | Milovan PMS            | —                           |
| Contact général       | —                      | mail.ia@eseo.fr             |

Le notebook Kaggle de l'activité 4 est accessible publiquement :  
[kaggle.com/code](https://www.kaggle.com/code) → recherche `ACTIVITE IA LYCEE`
