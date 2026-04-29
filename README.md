# Telintec GIS Khenifra

## Overview
Telintec GIS is a Geographic Information System (GIS) application tailored for the Khenifra region. It is designed to manage, visualize, and maintain telecommunications infrastructure equipment such as NROs, SRs, PCOs, and PCs. 

The project is split into a **Laravel 9 API backend** and a **React 19 / Vite frontend** featuring an interactive map with offline capabilities.

## Architecture & Technology Stack

### Backend
- **Framework**: Laravel 9.x (PHP 8.0+)
- **Authentication**: JWT Auth (JSON Web Tokens)
- **Database**: Relational database (managed via Laravel Eloquent and migrations).
- **Key Features**:
  - CRUD operations for `Equipements`, `Zones`, and `Ports`.
  - KMZ file import functionality (`/api/equipements/import-kmz`).
  - Secure API endpoints protected by JWT middleware.

### Frontend
- **Framework**: React 19, Vite
- **Mapping**: Leaflet, React-Leaflet, and Leaflet.offline (Google Maps Satellite layer with offline caching).
- **Styling/UI**: Custom CSS/JSX, Lucide-React for icons.
- **Key Features**:
  - Real-time map visualization of telecom nodes (NRO, SR, PCO, etc.).
  - Color-coded custom markers based on equipment type and status (e.g., maintenance).
  - Geolocation (User tracking).
  - Offline Map Tile downloading.
  - PWA support (`vite-plugin-pwa`).

---

## Installation & Setup

### Prerequisites
- PHP >= 8.0
- Composer
- Node.js >= 18 & npm/yarn
- A running database server (MySQL/PostgreSQL)

### Backend Setup (Laravel API)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install PHP dependencies:
   ```bash
   composer install
   ```
3. Setup Environment variables:
   ```bash
   cp .env.example .env
   ```
   *Configure your database credentials in the `.env` file.*
4. Generate the application key and JWT secret:
   ```bash
   php artisan key:generate
   php artisan jwt:secret
   ```
5. Run migrations and seeders:
   ```bash
   php artisan migrate --seed
   ```
6. Start the local development server:
   ```bash
   php artisan serve
   ```
   *The API will be accessible at `http://localhost:8000/api`*

### Frontend Setup (React/Vite)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Javascript dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on a local port (usually `http://localhost:5173`)*

---

## Equipment Types & Marker Legend
The map uses specific visual indicators for different types of equipment:
- **NRO** (Optical Connection Node): Purple (Large)
- **SR / SR_FIBER**: Dark Blue
- **SR_ADSL**: Orange/Chocolate
- **PCO / PCO_FIBER**: Deep Sky Blue
- **PC_COPPER**: Saddle Brown
- **Maintenance Status**: Equipment under maintenance features a dashed red border.

## API Endpoints Summary
**Auth (Prefix: `/api/auth/`):**
- `POST login`
- `POST register`
- `POST logout`
- `POST refresh`
- `GET me`

**Resources (Requires JWT Authentication):**
- `/api/equipements` (CRUD)
- `/api/zones` (CRUD)
- `/api/ports` (CRUD)
- `POST /api/equipements/import-kmz`
