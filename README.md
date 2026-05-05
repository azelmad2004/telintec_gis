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
## 👤 Identifiants par défaut
- **Admin** : `admin@test.com` / `password`
- **Technicien** : `technicien@test.com` / `password`

---

## 📝 Licence
Propriété de **Telintec S.A.** - Développé pour le stage NMS Khénifra.
