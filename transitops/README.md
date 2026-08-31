# TransitOps — Digitize Your Fleet

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## Overview
**TransitOps** is an end-to-end, modular fleet operations and management platform designed to eliminate error-prone spreadsheets. It unifies vehicle registries, driver safety compliance, live trip dispatching, preventative maintenance workflows, expense tracking, and real-time operational analytics into a cohesive, secure portal backed by strict Role-Based Access Control (RBAC).

---

## Problem Statement
Traditional logistics and transport companies frequently manage high-value assets across fragmented spreadsheets, whiteboard schedules, and disconnected paper logs. This causes severe visibility gaps, missed service intervals, compliance violations with expired licenses, unauthorized vehicle dispatches, and unnoticed operational cost leakage. TransitOps digitizes the entire lifecycle, enforcing validation rules at the API layer while delivering actionable real-time insights to dispatchers, fleet managers, safety officers, and financial analysts.

---

## Key Features

### 1. 📊 Executive Dashboard & Real-Time Analytics
- **Live Fleet KPIs**: Animated real-time counter metrics for Total Fleet, Active Trips, Utilization Rate (%), Maintenance In-Shop count, and Total Operational Expenses.
- **Fleet Status Distribution**: Interactive visual bar charts powered by Recharts showing fleet availability breakdown (`Available`, `On Trip`, `In Shop`, `Retired`).
- **Urgent Action Center**: Immediate alert banners highlighting critical operations such as licenses expiring within 15/30 days and overdue vehicle maintenance.
- **Recent Trip Activity**: Live monitoring table of dispatched, in-transit, and completed trips with real-time status badges.
- **Live Auto-Refresh**: 30-second background polling cycle with manual instant-refresh toggle.

### 2. 🔐 Authentication & Role-Based Access Control (RBAC)
- **4 Distinct Roles**: Pre-configured profiles for Fleet Manager, Dispatcher, Safety Officer, and Financial Analyst.
- **Dynamic RBAC Engine**: Granular `edit`, `view`, and `hidden` permission matrix enforced on both frontend UI navigation and backend API route middleware.
- **Live Database Authorization**: Re-evaluates user roles in the database per request to immediately apply permissions without waiting for token expiration.
- **Brute-Force Protection**: Automatic account lockout after 5 consecutive failed login attempts with a 15-minute cooldown.

### 3. 🚛 Fleet & Vehicle Registry
- Complete registry tracking registration number, vehicle model, vehicle type (`Van`, `Truck`, `Mini`), max cargo load capacity (kg), live odometer readings, acquisition cost, and deployment states.
- Case-insensitive unique registration number validation.
- Automated status integration: Vehicles marked `In Shop` or `Retired` are automatically excluded from trip dispatching pools.

### 4. 👨‍✈️ Driver Management & Safety Profiles
- Driver compliance tracking with license category classification (`LMV`, `HMV`, `Heavy Trailer`, `MCWG`), expiry dates, contact numbers, and safety scores.
- Medical & safety profile integration including Blood Group tracking and Emergency Contact information.
- Visual warning badges for licenses expiring within 30 days and hard blocks on assigning suspended or expired drivers.

### 5. 🗺️ Trip Dispatcher (Full Lifecycle)
- End-to-end trip creation: start/destination routing, cargo load verification against vehicle capacity, assigned driver, and estimated fuel expenses.
- Strict dispatch integrity: Blocks overloading vehicles beyond rated capacity and prevents double-booking active drivers/vehicles.
- Live status transitions: `Draft` → `Dispatched` → `Completed` or `Cancelled`, automatically syncing vehicle states to `On Trip` and restoring them upon completion.

### 6. 🔧 Maintenance & Service Workflow
- Track service logs with detailed repair types, service costs, service dates, and notes.
- Seamless status synchronization: Logging an active service automatically transitions the vehicle to `In Shop`.

### 7. ⛽ Fuel & Expense Management
- Track fuel receipts (liters, fuel cost, odometer at fill-up) and operational expenses (tolls, permits, insurance, repairs).
- Calculate cost-per-kilometer metrics and vehicle ROI trends.

### 8. ⚙️ Settings & System Customization
- Dynamic RBAC matrix editor accessible exclusively to Fleet Managers to modify system access rules on the fly.
- Theme Switcher: Dark and Light mode toggle with persistent local and server-synchronized preferences.
- Error Boundary fallback screen preventing full-application crashes.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 (Vite), Tailwind CSS v4 | Responsive Single Page Application |
| **Charts** | Recharts | Fleet distribution & operational analytics charts |
| **Icons** | Lucide React | Clean, semantic UI icons |
| **Backend** | Node.js, Express.js | RESTful API architecture |
| **Database** | MongoDB & Mongoose ODM | Document persistence & schema validation |
| **Security & Auth** | JWT, bcrypt, Cookie-Parser, Helmet, Mongo-Sanitize, Express-Rate-Limit | Production-grade API security & rate limiting |

---

## Architecture Overview

```text
transitops/
├── client/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── pages/               # Feature Modules
│   │   │   ├── Dashboard.jsx        # Analytics, KPIs, Urgent Alerts & Charts
│   │   │   ├── TripDispatcher.jsx   # Dispatch workflow & assignment
│   │   │   ├── FuelExpenses.jsx     # Fuel logging & expense tracking
│   │   │   ├── ReportsAnalytics.jsx # Financial & fleet ROI analytics
│   │   │   ├── Settings.jsx         # RBAC matrix editor & preferences
│   │   │   ├── Login.jsx            # Secure login & lockout handling
│   │   │   └── Register.jsx         # Validated account registration
│   │   ├── App.jsx              # Core navigation, state & layout controller
│   │   ├── ErrorBoundary.jsx    # React Error Boundary crash protection
│   │   └── main.jsx             # React DOM root & global fetch interceptor
│   └── package.json
│
├── server/                      # Node.js Express Backend
│   ├── controllers/             # Request handling & business logic
│   ├── middleware/              # Auth verification, RBAC guards & rate limiters
│   ├── models/                  # Mongoose data schemas (Vehicle, Driver, Trip, etc.)
│   ├── routes/                  # Modular API route definitions
│   ├── scripts/                 # Database seed utilities (seed.js, seed_all.js)
│   ├── server.js                # Express entry point & middleware pipeline
│   └── package.json
│
└── README.md
```

---

## Business Rules Implemented

- **Unique Vehicle Identifiers**: Enforces unique, case-insensitive registration numbers.
- **Overload Prevention**: Blocks dispatching any trip where cargo weight exceeds the vehicle's `maxLoadCapacity`.
- **Driver Safety Validation**: Prohibits assigning suspended drivers or drivers with expired licenses to trips.
- **Asset State Lock**: Vehicles marked `In Shop` or `Retired` cannot be selected for new dispatches.
- **Trip Lifecycle Sync**: Dispatching a trip automatically marks the assigned vehicle and driver as `On Trip`; completing or cancelling releases them back to `Available`.
- **Maintenance Trigger**: Creating an active maintenance log shifts the target vehicle to `In Shop`.
- **Live RBAC Invalidation**: Changing permissions immediately restricts API endpoints and navigation tabs without requiring a new JWT issue.

---

## Roles & Permissions Matrix

| Module | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
|---|:---:|:---:|:---:|:---:|
| **Dashboard / Analytics** | View | Edit | View | Edit |
| **Fleet Registry** | **Edit** | View | Hidden | View |
| **Driver Profiles** | **Edit** | Hidden | **View** | Hidden |
| **Trip Dispatcher** | Hidden | **Edit** | Hidden | Hidden |
| **Fuel & Expenses** | Hidden | **Edit** | Hidden | **View** |
| **Settings (RBAC Matrix)** | **Edit** | Hidden | Hidden | Hidden |

---

## Getting Started / Setup Instructions

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally on `mongodb://localhost:27017` (or a remote MongoDB Atlas URI)

### 2. Installation & Setup
```bash
# 1. Clone the repository
git clone <repo-url>
cd transitops

# 2. Setup and install backend dependencies
cd server
npm install

# 3. Setup backend environment variables
# Copy .env.example to .env and adjust if needed
cp .env.example .env

# 4. Seed demo users, vehicles, drivers, and initial RBAC configuration
npm run seed

# 5. Start backend development server (Runs on port 5000)
npm run dev

# 6. In a new terminal, setup and run the frontend
cd ../client
npm install
npm run dev
```

The frontend will be available at **`http://localhost:5173`** (or `http://localhost:5174` if 5173 is occupied).

---

## Demo / Test Credentials

All pre-seeded test accounts use the password: `Password@123`

| Role | Email | Password | Primary Accessible Modules |
|---|---|---|---|
| **Fleet Manager** | `fleetmanager@transitops.io` | `Password@123` | Vehicle Registry, Driver Management, Settings (RBAC) |
| **Dispatcher** | `dispatcher@transitops.io` | `Password@123` | Dashboard, Trip Dispatcher, Fuel & Expenses |
| **Safety Officer** | `safety@transitops.io` | `Password@123` | Driver Safety Profiles, License Compliance Alerts |
| **Financial Analyst** | `finance@transitops.io` | `Password@123` | Dashboard, Fuel & Expenses, Reports & Analytics |

---

## Environment Variables

Configured in `server/.env`:

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `PORT` | No | `5000` | Port for Express REST API |
| `MONGO_URI` | Yes | `mongodb://localhost:27017/transitops` | MongoDB connection URI |
| `JWT_SECRET` | Yes | *configured* | Secret key for signing authentication JWTs |
| `NODE_ENV` | No | `development` | Environment mode (`development` / `production`) |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Allowed frontend origin for CORS |

---

## API Overview

### Authentication & User
- `POST /api/auth/login` — Authenticate and receive HTTP-only cookie
- `POST /api/auth/register` — Register new user (validated role & password rules)
- `POST /api/auth/logout` — Invalidate session and clear auth cookie
- `GET /api/auth/me` — Retrieve current authenticated user profile

### Dashboard & Analytics
- `GET /api/dashboard/summary` — Aggregated KPI metrics, urgent alerts, and fleet status breakdown
- `GET /api/dashboard/stats` — Detailed statistical trend data

### Fleet & Vehicles
- `GET /api/vehicles` — Retrieve all vehicles with optional filters
- `POST /api/vehicles` — Register a new fleet vehicle
- `PATCH /api/vehicles/:id` — Update vehicle specifications or status
- `DELETE /api/vehicles/:id` — Remove vehicle from registry

### Drivers
- `GET /api/drivers` — Retrieve all driver compliance profiles
- `POST /api/drivers` — Create driver profile with license and medical contact
- `PATCH /api/drivers/:id` — Update driver details, category, or status
- `DELETE /api/drivers/:id` — Remove driver

### Trips & Dispatching
- `GET /api/trips` — Fetch all trips with populated driver/vehicle records
- `POST /api/trips` — Create and dispatch trip (validates cargo capacity & availability)
- `PATCH /api/trips/:id` — Update trip status (`Dispatched`, `Completed`, `Cancelled`)

### Maintenance & Expenses
- `GET /api/maintenance` / `POST /api/maintenance` — Service logs and repair triggers
- `GET /api/fuel` / `POST /api/fuel` — Fuel logs and fill-up records
- `GET /api/expenses` / `POST /api/expenses` — Operational expenses tracking
- `GET /api/settings/rbac` / `PUT /api/settings/rbac` — View and edit dynamic RBAC rules

---

## Screenshots

![Dashboard Overview](./docs/screenshots/dashboard.png)
![Trip Dispatcher](./docs/screenshots/trip-dispatcher.png)

---

## Known Limitations / Deferred Features

The following items are recognized as production hardening items intentionally out of scope for the hackathon build:
- Automated PDF report generator (data is currently visualized directly on screen).
- Push/SMS notifications for driver license expirations (visual priority badge alerts are provided in-app).
- Redis-backed distributed rate limiting & token rotation (in-memory rate limiting with proxy trust is active).
- Real-time GPS telematics integration (simulated via manual trip dispatch transitions).

---

## Team

- **TransitOps Development Team**
