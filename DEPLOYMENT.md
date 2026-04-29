# Deployment Guide: Railway & GitHub

This guide covers how to push your code to GitHub and deploy both your Backend (Laravel) and Frontend (React/Vite) to Railway.

## 1. Push to GitHub
First, you need to commit your code and push it to a new GitHub repository.

Open a terminal in your project root (`c:\Users\azelmad\Desktop\prj stage`) and run:
```bash
git init
git add .
git commit -m "Initial commit: Telintec GIS"
git branch -M main
```

Go to GitHub, create a new empty repository, and then run:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## 2. Deploy to Railway

Railway can automatically detect and build your frontend and backend if you deploy them as separate services from the same monorepo.

### Step 2.1: Create a Railway Project
1. Go to [Railway.app](https://railway.app/) and log in.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your newly created repository.

### Step 2.2: Deploy the Backend (Laravel)
1. In your Railway project dashboard, click **New** -> **GitHub Repo** and select your repo again.
2. Go to the settings of this new service.
3. Under **Build**, set the **Root Directory** to `/backend`.
4. Under **Variables**, add your production environment variables (copy from your `.env`):
   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - `APP_KEY=base64:0kLGkX8tg0cYd1zDToMxJ/ptbSA1WY6eI/P4YSHnBCw=` (Use a new one if possible)
   - `DB_CONNECTION=sqlite` (or provision a MySQL database on Railway and add the credentials)
   - `JWT_SECRET=Z9sNxGSzSY9ulrwNyYQxYp4lqANSpj5QriEF1dOcsZFXPXpf5YZwH7bd9zpyOkTh`
5. Railway's Nixpacks will automatically configure Nginx and PHP for Laravel.
6. Generate a Domain for this service (e.g., `telintec-backend.up.railway.app`).

### Step 2.3: Deploy the Frontend (React/Vite)
1. Click **New** -> **GitHub Repo** and select the same repository.
2. Go to the settings of this second service.
3. Under **Build**, set the **Root Directory** to `/frontend`.
4. Under **Variables**, add your backend URL so the frontend knows where to make API calls:
   - `VITE_API_BASE_URL=https://telintec-backend.up.railway.app/api` (Replace with your actual backend Railway domain)
5. Under **Build**, ensure the Build Command is `npm run build`.
6. Railway will automatically serve the static files. 
7. Generate a Domain for this service (e.g., `telintec-frontend.up.railway.app`).

---

## 3. Local Testing Links
I have started the servers for you! You can test the application locally using the following links:

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)

> Note: Make sure to update `frontend/src/api/axiosInstance.js` to point to the correct production URL once you deploy to Railway.
