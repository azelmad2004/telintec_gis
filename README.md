# 🛰️ Telintec NMS - Gestion d'Infrastructure Khénifra

Une plateforme moderne de gestion d'infrastructure réseau (NMS) permettant la visualisation géospatiale, l'importation de fichiers KMZ et la gestion fine de la capacité des ports.

![Status](https://img.shields.io/badge/Status-Ready_for_Deployment-success?style=for-the-badge)
![Tech](https://img.shields.io/badge/Stack-Laravel_9_%2B_React_18-blue?style=for-the-badge)

---

## 🚀 Fonctionnalités Clés

- **🗺️ Cartographie Interactive** : Visualisation en temps réel des équipements (NRO, SR, PCO) via Leaflet.
- **📥 Importation KMZ Intelligente** : Parsing automatique des fichiers KML/KMZ avec gestion des zones et correction des typos de parenté (ex: `0` vs `O`).
- **📊 Dashboard de Planification** : Statistiques détaillées sur l'occupation des ports et l'état du réseau.
- **🔌 Gestion des Ports** : Suivi précis des abonnés et de la saturation des équipements.
- **🔐 Sécurité JWT** : Authentification robuste pour les administrateurs et les techniciens.

---

## 🛠️ Stack Technique

### Backend (Laravel)
- **API REST** : Laravel 9
- **Auth** : JWT-Auth (Tymon)
- **Base de données** : MySQL / MariaDB
- **Features** : Eager loading optimisé, withCount pour les performances, normalisation de noms.

### Frontend (React)
- **Framework** : React 18 avec Vite
- **UI** : Vanilla CSS Premium, Lucide Icons
- **Maps** : React-Leaflet
- **State** : Axios avec intercepteurs

---

## 📦 Installation Locale

### 1. Prérequis
- PHP 8.1+ & Composer
- Node.js 18+ & NPM
- MySQL

### 2. Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
# Configurez votre DB dans le .env
php artisan migrate --path=Migration.php
php artisan serve --port=8888
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Créez un fichier .env.local
echo "VITE_API_URL=http://localhost:8888/api" > .env.local
npm run dev
```

---

## 🚢 Déploiement sur Railway

### Préparation GitHub
1. Créez un nouveau dépôt sur GitHub.
2. Poussez le code :
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <votre-repo-url>
git push -u origin main
```

### Configuration Railway
1. **New Project** -> **GitHub Repo**.
2. **Backend Service** :
   - Root Directory : `backend`
   - Start Command : `php artisan serve --host=0.0.0.0 --port=$PORT`
   - Variables d'environnement : `APP_KEY`, `JWT_SECRET`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`.
3. **Frontend Service** :
   - Root Directory : `frontend`
   - Build Command : `npm run build`
   - Variables d'environnement : `VITE_API_URL` (URL de votre backend Railway).

---

## 👤 Identifiants par défaut
- **Admin** : `admin@test.com` / `password`
- **Technicien** : `technicien@test.com` / `password`

---

## 📝 Licence
Propriété de **Telintec S.A.** - Développé pour le stage NMS Khénifra.
