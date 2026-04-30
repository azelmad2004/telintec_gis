# Telintec Khénifra - Système de Gestion d'Infrastructure GIS (NMS)

Une application web complète (Système d'Information Géographique) conçue pour la gestion, la visualisation et la planification de l'infrastructure réseau (Fibre Optique FTTH et Cuivre ADSL) de Telintec dans la région de Khénifra.

## 🚀 Vue d'ensemble du Projet

Ce projet permet aux techniciens de visualiser l'emplacement exact des équipements sur le terrain via une carte interactive (Google Satellite), de gérer les ports des PCO/SR, et d'importer des données géographiques directement depuis Google My Maps (KMZ/KML). Il offre également aux administrateurs un tableau de bord de planification avec des outils d'exportation de rapports (PDF/Excel).

---

## 🛠️ Stack Technique

### Backend (API REST)
- **Framework**: Laravel 9.x
- **Langage**: PHP 8.0+
- **Authentification**: JWT (JSON Web Tokens) via `tymon/jwt-auth`
- **Base de données**: MySQL (ou SQLite pour le développement local)
- **Fonctionnalités Clés**: Parsing XML/KML, Gestion de hiérarchie d'équipements.

### Frontend (SPA)
- **Framework**: React 19
- **Build Tool**: Vite 8.x
- **Cartographie**: Leaflet & React-Leaflet (avec support Offline)
- **Styling**: Vanilla CSS (Design Premium & Responsive)
- **Icônes**: Lucide React
- **Rapports**: jsPDF & jsPDF-AutoTable
- **PWA**: Support Progressive Web App pour une utilisation sur tablette sur le terrain.

---

## ✨ Fonctionnalités Principales

### 🗺️ Module Technicien (SIG)
- **Carte Interactive**: Visualisation des NRO, SR, et PCO sur fond de carte satellite Google.
- **Support Offline**: Mise en cache des tuiles de carte pour une utilisation en zones sans couverture réseau.
- **Arbre Hiérarchique**: Navigation fluide dans la structure du réseau (NRO -> SR -> Splitter -> PCO).
- **Gestion des Ports**: Visualisation de l'état d'occupation des ports (Libre/Plein) et ajout de clients.
- **Import KMZ/KML**: Importation massive d'équipements depuis des fichiers Google Earth.
- **Géolocalisation**: Positionnement en temps réel sur la carte via GPS.

### 📊 Module Planning (Dashboard)
- **Inventaire Réseau**: Liste complète et filtrable de tous les nœuds installés.
- **Statistiques en Temps Réel**: Taux de saturation du réseau, décompte par type d'infrastructure (Fibre/Cuivre).
- **Exportation de Rapports**: Génération de fichiers PDF et Excel (CSV) pour l'inventaire NMS.
- **Gestion de Maintenance**: Identification rapide des nœuds nécessitant une intervention.

### 🔐 Sécurité
- Authentification sécurisée par Token.
- Gestion des rôles (Admin vs Technicien).
- Routes API protégées par middleware.

---

## 📁 Structure du Projet

```text
prj stage/
├── backend/                # API Laravel
│   ├── app/
│   │   ├── Http/           # Contrôleurs (Auth, Equipement, Zone, Port)
│   │   └── Models/         # Modèles Eloquent (User, Equipement, Zone, Port)
│   ├── database/           # Migrations et Seeders (Données de test massives)
│   ├── routes/             # Définition des routes API
│   └── .env.example        # Configuration environnement backend
│
└── frontend/               # Interface React
    ├── src/
    │   ├── api/            # Configuration Axios
    │   ├── components/     # Composants réutilisables (Map, Layout)
    │   ├── pages/          # Pages principales (Login, Tech, Planning)
    │   └── App.jsx         # Routage principal
    └── vite.config.js      # Configuration Vite et PWA
```

---

## ⚙️ Installation et Configuration

### 1. Prérequis
- PHP 8.0+ & Composer
- Node.js & npm
- Serveur MySQL

### 2. Configuration du Backend
```bash
cd backend
composer install
cp .env.example .env
# Configurez votre base de données dans le fichier .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate --seed
php artisan serve
```

### 3. Configuration du Frontend
```bash
cd frontend
npm install
# Créez un fichier .env avec VITE_API_URL=http://localhost:8000/api
npm run dev
```

---

## 📡 API Endpoints (Principaux)

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authentification utilisateur |
| `GET` | `/api/equipements` | Liste tous les équipements |
| `POST` | `/api/equipements` | Créer un nouvel équipement |
| `POST` | `/api/import-kmz` | Importer un fichier KMZ/KML |
| `PUT` | `/api/ports/{id}` | Changer l'état d'un port |
| `GET` | `/api/zones` | Liste des quartiers/zones |

---

## 📝 Auteur
Développé dans le cadre du projet de stage - **Telintec S.A. 2026**.
