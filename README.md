# CampusConnect – All College Events in One Place

Full-stack college events platform: React + Tailwind frontend, Node + Express + Mongoose backend, MongoDB (Atlas) database.

## Setup

### 1. MongoDB Atlas

- Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
- Get the connection string and add it to `server/.env` as `MONGODB_URI`.

### 2. Backend

```bash
cd server
cp ../.env.example .env
# Edit .env: set MONGODB_URI, JWT_SECRET
npm install
npm run dev
```

Runs on `http://localhost:5000`.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Runs on `http://localhost:5173`. Vite proxies `/api` to the backend.

### 4. First admin user

Register normally via the app with role **Organizer**, then change the user's `role` to `admin` in MongoDB Compass or Atlas UI so you can access `/admin` and verify organizers.

## Features

- **Students**: Browse events, filter by category/date/search, see countdown, personalized Dashboard (Recommended for You).
- **Organizers**: Add/edit events (poster URL, details, registration link, deadline, category, tags). Verified badge when approved by admin.
- **Admin**: Block/unblock events, delete events, verify organizers.

## Env

- **Server** (in `server/.env`): `MONGODB_URI`, `JWT_SECRET`, `PORT`, `CLIENT_URL` (optional).
- **Client** (in `client/.env`): `VITE_API_URL` (optional; dev uses proxy `/api` → backend).
