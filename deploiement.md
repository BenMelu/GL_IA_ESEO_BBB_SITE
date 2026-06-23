# Guide de déploiement — ESE'IA
## Nginx + Gunicorn + Flask sur Debian

---

## Sommaire

1. [Vue d'ensemble de l'architecture](#1-vue-densemble)
2. [Mise à jour du système](#2-mise-à-jour-du-système)
3. [Installation de Python et des dépendances](#3-installation-python-et-dépendances)
4. [Installation de Nginx](#4-installation-de-nginx)
5. [Transfert des fichiers du projet](#5-transfert-des-fichiers-du-projet)
6. [Configuration de l'environnement Python](#6-configuration-de-lenvironnement-python)
7. [Configuration de Gunicorn](#7-configuration-de-gunicorn)
8. [Configuration du service systemd pour Gunicorn](#8-service-systemd-gunicorn)
9. [Configuration de Nginx](#9-configuration-de-nginx)
10. [HTTPS avec Let's Encrypt](#10-https-avec-lets-encrypt)
11. [Démarrage et vérification](#11-démarrage-et-vérification)
12. [Commandes utiles](#12-commandes-utiles)
13. [Surveillance et monitoring](#13-surveillance-et-monitoring)

---

## 1. Vue d'ensemble

### Architecture finale

```
Internet (port 443/80)
        │
        ▼
    [ Nginx ]  ←─── Sert les fichiers statiques (HTML/CSS/JS)
        │            directement depuis /var/www/eseia/
        │
        │  /process (proxy_pass)
        ▼
   [ Gunicorn ]  ←─── Serveur WSGI Python (5-8 workers)
        │
        ▼
   [ Flask + TensorFlow ]  ←─── app.py avec les 3 modèles IA
```

### Pourquoi cette architecture

- **Nginx** est optimisé pour servir des fichiers statiques rapidement
  et gérer des milliers de connexions simultanées
- **Gunicorn** remplace le serveur Flask de développement —
  il gère plusieurs requêtes en parallèle grâce aux workers
- **Flask** ne voit jamais Internet directement — il est protégé
  derrière Nginx et Gunicorn

---

## 2. Mise à jour du système

Se connecter à la VM puis mettre à jour tous les paquets :

```bash
sudo apt update && sudo apt upgrade -y
```

Installer les outils essentiels :

```bash
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    build-essential \
    ufw
```

Configurer le pare-feu (UFW) :

```bash
# Autoriser SSH (important — ne pas oublier sinon on se coupe l'accès)
sudo ufw allow OpenSSH

# Autoriser HTTP et HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Activer le pare-feu
sudo ufw enable

# Vérifier
sudo ufw status
```

---

## 3. Installation Python et dépendances

Vérifier la version Python disponible :

```bash
python3 --version
```

Debian 13 est livré avec Python 3.12+. Installer pip et venv :

```bash
sudo apt install -y python3-pip python3-venv python3-dev
```

Installer les dépendances système nécessaires à OpenCV et python-magic :

```bash
sudo apt install -y \
    libmagic1 \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6
```

---

## 4. Installation de Nginx

```bash
sudo apt install -y nginx

# Démarrer et activer au boot
sudo systemctl start nginx
sudo systemctl enable nginx

# Vérifier que Nginx tourne
sudo systemctl status nginx
```

Tester dans un navigateur en entrant l'adresse IP de la VM —
la page par défaut Nginx doit s'afficher.

---

## 5. Transfert des fichiers du projet

### Structure attendue sur le serveur

```
/var/www/eseia/          ← frontend (fichiers statiques)
│
├── index.html
├── pages/
├── css/
├── js/
└── assets/

/opt/eseia/              ← backend Flask
│
├── app.py
├── IA_chats_chiens.keras
├── modelMNIST.keras
├── modelTita.keras
└── scalerTita.save
```

### Créer les dossiers

```bash
# Frontend
sudo mkdir -p /var/www/eseia

# Backend
sudo mkdir -p /opt/eseia

# Donner les droits à l'utilisateur courant
sudo chown -R $USER:$USER /var/www/eseia
sudo chown -R $USER:$USER /opt/eseia
```

### Transférer les fichiers depuis Windows

Depuis ton terminal **Windows** (PowerShell), utiliser `scp` :

```powershell
# Transférer le frontend (depuis le dossier eseia/)
scp -i C:\Users\gcoup\.ssh\id_ed25519_eseiadeploy -r * vagrant@192.168.1.125:/var/www/eseia/

# Transférer le backend (depuis le dossier back/)
scp -i C:\Users\gcoup\.ssh\id_ed25519_eseiadeploy app.py vagrant@192.168.1.125:/opt/eseia/
scp -i C:\Users\gcoup\.ssh\id_ed25519_eseiadeploy *.keras vagrant@192.168.1.125:/opt/eseia/
scp -i C:\Users\gcoup\.ssh\id_ed25519_eseiadeploy *.save vagrant@192.168.1.125:/opt/eseia/
```

Remplacer `user` par ton nom d'utilisateur sur la VM
et `ADRESSE_IP_VM` par l'IP de ta VM.

### Alternative — Git

Si le projet est sur un dépôt Git :

```bash
# Sur le serveur
cd /var/www
sudo git clone https://ton-repo.git eseia

cd /opt
sudo git clone https://ton-repo-back.git eseia-back
```

---

## 6. Configuration de l'environnement Python

Créer un environnement virtuel Python isolé pour le backend :

```bash
cd /opt/eseia

# Créer l'environnement virtuel
python3 -m venv venv

# L'activer
source venv/bin/activate

# Vérifier qu'on est dans le venv
which python  # doit afficher /opt/eseia/venv/bin/python
```

Installer les dépendances Python :

```bash
pip install --upgrade pip

pip install \
    flask \
    flask-cors \
    gunicorn \
    tensorflow \
    opencv-python-headless \
    numpy \
    pandas \
    scikit-learn \
    joblib \
    python-magic
```

> **Note** : `opencv-python-headless` est la version sans interface graphique,
> adaptée aux serveurs. Ne pas installer `opencv-python` (version desktop).

Vérifier que app.py fonctionne dans le venv :

```bash
python app.py
# Doit afficher : Running on http://0.0.0.0:5000
# Ctrl+C pour arrêter
```

Désactiver le venv :

```bash
deactivate
```

---

## 7. Configuration de Gunicorn

Créer le fichier de configuration Gunicorn :

```bash
nano /opt/eseia/gunicorn.conf.py
```

Contenu du fichier :

```python
# =============================================================================
# gunicorn.conf.py — Configuration Gunicorn pour ESE'IA
# =============================================================================

import multiprocessing

# -- Workers --
# Formule recommandée : (2 × CPU) + 1
# Avec 2 vCPU → 5 workers
# Chaque worker charge les modèles TensorFlow en mémoire (~30 Mo chacun)
# Ajuster si la RAM est insuffisante
workers = (multiprocessing.cpu_count() * 2) + 1

# -- Type de worker --
# sync : simple, adapté aux tâches longues (inférence IA)
# Ne pas utiliser gevent/eventlet avec TensorFlow
worker_class = "sync"

# -- Timeouts --
# Les inférences IA peuvent prendre plusieurs secondes
# Mettre un timeout suffisant pour éviter les kills prématurés
timeout = 120          # secondes avant qu'un worker soit tué
graceful_timeout = 30  # secondes pour finir les requêtes en cours

# -- Connexions --
# Nombre de connexions en attente par worker
worker_connections = 1000

# -- Binding --
# Écouter uniquement en localhost — Nginx fait le proxy
bind = "127.0.0.1:5000"

# -- Logs --
accesslog = "/var/log/gunicorn/access.log"
errorlog  = "/var/log/gunicorn/error.log"
loglevel  = "info"

# -- Process --
# Nom affiché dans htop/ps
proc_name = "eseia-backend"

# -- Préchargement --
# Charger app.py avant de forker les workers
# Les modèles TensorFlow sont chargés une fois puis partagés en mémoire
# (Copy-on-Write sur Linux — économie de RAM significative)
preload_app = True
```

Créer le dossier de logs :

```bash
sudo mkdir -p /var/log/gunicorn
sudo chown $USER:$USER /var/log/gunicorn
```

Tester Gunicorn manuellement :

```bash
cd /opt/eseia
source venv/bin/activate

gunicorn --config gunicorn.conf.py app:app

# Tester dans un autre terminal
curl http://127.0.0.1:5000/
# Ctrl+C pour arrêter
deactivate
```

---

## 8. Service systemd Gunicorn

Créer un service systemd pour que Gunicorn démarre automatiquement
au reboot et redémarre en cas de crash :

```bash
sudo nano /etc/systemd/system/eseia-backend.service
```

Contenu du fichier :

```ini
[Unit]
Description=ESE'IA — Backend Flask via Gunicorn
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/eseia

# Utiliser le Python du venv
ExecStart=/opt/eseia/venv/bin/gunicorn \
          --config /opt/eseia/gunicorn.conf.py \
          app:app

# Redémarrage automatique en cas de crash
Restart=always
RestartSec=5

# Variables d'environnement
Environment="PATH=/opt/eseia/venv/bin"
Environment="PYTHONPATH=/opt/eseia"

# Logs systemd (en plus des logs Gunicorn)
StandardOutput=append:/var/log/gunicorn/system.log
StandardError=append:/var/log/gunicorn/system-error.log

[Install]
WantedBy=multi-user.target
```

Donner les droits à www-data sur les dossiers nécessaires :

```bash
sudo chown -R www-data:www-data /opt/eseia
sudo chown -R www-data:www-data /var/log/gunicorn
```

Activer et démarrer le service :

```bash
# Recharger systemd
sudo systemctl daemon-reload

# Activer au démarrage
sudo systemctl enable eseia-backend

# Démarrer
sudo systemctl start eseia-backend

# Vérifier
sudo systemctl status eseia-backend
```

La sortie doit afficher `Active: active (running)`.

---

## 9. Configuration de Nginx

Supprimer la configuration par défaut :

```bash
sudo rm /etc/nginx/sites-enabled/default
```

Créer la configuration ESE'IA :

```bash
sudo nano /etc/nginx/sites-available/eseia
```

Contenu du fichier :

```nginx
# =============================================================================
# /etc/nginx/sites-available/eseia
# Configuration Nginx pour ESE'IA
# =============================================================================

# -- Limitation du taux de requêtes --
# Protège le backend contre les abus
# 10 requêtes/seconde par IP sur les endpoints IA
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    listen 80;
    listen [::]:80;
    server_name votre-domaine.eseo.fr;    # ← remplacer par votre domaine

    # Redirection HTTP → HTTPS (décommenter après installation Let's Encrypt)
    # return 301 https://$host$request_uri;

    # Dossier racine du frontend
    root /var/www/eseia;
    index index.html;

    # -- Compression gzip --
    # Réduit la taille des fichiers transférés
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
    gzip_min_length 1000;

    # -- Cache des fichiers statiques --
    # CSS, JS, images : mis en cache 30 jours côté navigateur
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # -- Fichiers HTML et pages dynamiques --
    # Pas de cache pour le HTML (pour que les mises à jour soient immédiates)
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # -- Proxy vers le backend Flask/Gunicorn --
    # Toutes les requêtes vers /process sont redirigées vers Gunicorn
    location /process {
        # Limitation du taux : 10 req/s, burst de 20 autorisé
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;

        # Headers nécessaires pour Flask
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # Timeouts (les modèles IA peuvent être lents)
        proxy_connect_timeout 10s;
        proxy_send_timeout    120s;
        proxy_read_timeout    120s;

        # Taille max de l'upload (images — 10 Mo + marge)
        client_max_body_size 15M;

        # Exposer le header personnalisé Flask au navigateur
        # Nécessaire pour que X-Process-Texts soit accessible en JS
        add_header Access-Control-Expose-Headers "X-Process-Texts";
    }

    # -- Sécurité --
    # Masquer la version de Nginx
    server_tokens off;

    # Headers de sécurité
    add_header X-Content-Type-Options  "nosniff";
    add_header X-Frame-Options         "SAMEORIGIN";
    add_header X-XSS-Protection        "1; mode=block";

    # -- Logs --
    access_log /var/log/nginx/eseia-access.log;
    error_log  /var/log/nginx/eseia-error.log;
}
```

Activer la configuration et tester :

```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/eseia /etc/nginx/sites-enabled/

# Tester la syntaxe
sudo nginx -t
# Doit afficher : syntax is ok / test is successful

# Recharger Nginx
sudo systemctl reload nginx
```

---

## 10. HTTPS avec Let's Encrypt

HTTPS est indispensable en production. Let's Encrypt fournit des certificats
gratuits via l'outil Certbot.

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir le certificat (remplacer par votre domaine)
sudo certbot --nginx -d votre-domaine.eseo.fr

# Suivre les instructions interactives :
# - Entrer une adresse email
# - Accepter les conditions
# - Choisir la redirection HTTP → HTTPS (option 2)
```

Certbot modifie automatiquement la configuration Nginx pour :
- Activer HTTPS sur le port 443
- Rediriger HTTP → HTTPS

Le certificat se renouvelle automatiquement tous les 90 jours.
Vérifier le renouvellement automatique :

```bash
sudo certbot renew --dry-run
```

---

## 11. Démarrage et vérification

### Vérifier que tout tourne

```bash
# Gunicorn / Flask
sudo systemctl status eseia-backend

# Nginx
sudo systemctl status nginx

# Tester le backend directement
curl http://127.0.0.1:5000/

# Tester via Nginx
curl http://votre-domaine.eseo.fr/
```

### Test rapide du backend depuis le serveur

```bash
# Tester la démo Titanic (D1)
curl -X POST "http://127.0.0.1:5000/process?ml=1" \
  -F "Pclass=1" \
  -F "Sex=1" \
  -F "Age=30" \
  -F "SibSp=0" \
  -F "Parch=0" \
  -F "Fare=50.00" \
  -F "Embarked=0" \
  -F "LWeight=15.00"

# Réponse attendue : {"tauxSurvie": "XX.XX"}
```

### Vérifier les logs en cas de problème

```bash
# Logs Nginx
sudo tail -f /var/log/nginx/eseia-error.log

# Logs Gunicorn
sudo tail -f /var/log/gunicorn/error.log

# Logs systemd
sudo journalctl -u eseia-backend -f
```

---

## 12. Commandes utiles

### Gunicorn / Backend

```bash
# Démarrer
sudo systemctl start eseia-backend

# Arrêter
sudo systemctl stop eseia-backend

# Redémarrer (après modification de app.py)
sudo systemctl restart eseia-backend

# Recharger sans coupure (après modification mineure)
sudo systemctl reload eseia-backend

# Voir les logs en temps réel
sudo journalctl -u eseia-backend -f
```

### Nginx / Frontend

```bash
# Recharger la config (sans coupure)
sudo systemctl reload nginx

# Redémarrer
sudo systemctl restart nginx

# Tester la syntaxe de la config
sudo nginx -t
```

### Mettre à jour le frontend

```bash
# Depuis Windows, re-transférer les fichiers modifiés
scp -r css/ user@ADRESSE_IP:/var/www/eseia/
scp pages/demo.html user@ADRESSE_IP:/var/www/eseia/pages/

# Pas besoin de redémarrer Nginx — les fichiers statiques sont servis
# directement depuis le disque
```

### Mettre à jour le backend

```bash
# Transférer le nouveau app.py
scp app.py user@ADRESSE_IP:/opt/eseia/

# Donner les droits
sudo chown www-data:www-data /opt/eseia/app.py

# Redémarrer Gunicorn pour charger le nouveau code
sudo systemctl restart eseia-backend
```

---

## 13. Surveillance et monitoring

### Consommation mémoire en temps réel

```bash
# Vue de tous les processus Gunicorn
watch -n 2 "ps aux | grep gunicorn"

# Vue globale CPU + RAM
htop
```

### Nombre de connexions actives

```bash
# Connexions vers Nginx
ss -s

# Connexions vers Gunicorn
ss -tnp | grep 5000
```

### Logs d'accès en temps réel

```bash
# Voir toutes les requêtes entrantes
sudo tail -f /var/log/nginx/eseia-access.log

# Voir uniquement les erreurs
sudo tail -f /var/log/nginx/eseia-error.log | grep -i error
```

### Espace disque

```bash
df -h
```

---

## Récapitulatif des fichiers créés

| Fichier | Rôle |
|---------|------|
| `/var/www/eseia/` | Frontend (HTML/CSS/JS) servi par Nginx |
| `/opt/eseia/` | Backend Flask + modèles IA |
| `/opt/eseia/venv/` | Environnement Python isolé |
| `/opt/eseia/gunicorn.conf.py` | Configuration Gunicorn |
| `/etc/systemd/system/eseia-backend.service` | Service systemd |
| `/etc/nginx/sites-available/eseia` | Configuration Nginx |
| `/var/log/gunicorn/` | Logs Gunicorn |
| `/var/log/nginx/eseia-*.log` | Logs Nginx |