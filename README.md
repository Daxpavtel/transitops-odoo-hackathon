# TransitOps — Digitize Your Fleet

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

## Overview
TransitOps is a modern, modular fleet management platform designed to replace chaotic spreadsheets with a streamlined, digitized workflow. It centralizes vehicle registries, driver safety profiles, trip dispatching, and maintenance logs into a single, cohesive dashboard with robust role-based access control.

## Problem Statement
Logistics companies often rely on disjointed spreadsheets and manual tracking to manage fleets, leading to compliance risks, forgotten maintenance, and revenue leaks. TransitOps digitizes this entire process, enforcing operational rules at the system level while providing real-time visibility and control over fleet assets and personnel.

## Key Features
- **Authentication & RBAC**: Secure login with 4 distinct roles (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst) and strict module-level access control.
- **Vehicle Registry**: Track vehicle types, load capacities, odometer readings, acquisition costs, and operational statuses.
- **Driver Management**: Maintain driver profiles, monitor license expiries and safety scores, and track vital medical data (blood group & emergency contacts).
- **Trip Dispatcher**: Manage the full lifecycle of trips, assign available drivers and vehicles, and prevent the dispatch of suspended drivers or in-shop vehicles.
- **Maintenance Workflow**: Log vehicle service records, track repair costs, and automatically transition vehicle statuses.
- **Fuel & Expense Management**: Monitor operational costs, track fuel consumption, and manage trip-related expenses.
- **Dashboard & Analytics**: High-level overview of fleet efficiency, revenue, and active operations.
- **Settings & RBAC Matrix**: Dynamically configure role permissions via an interactive matrix (restricted to Fleet Managers).
- **Dark/Light Mode**: Full theme support for user preference.
- **Responsive Design**: Fluid UI scaling for modern desktop browsers.

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, Recharts, Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT, bcrypt, cookie-parser |
| Security | helmet, express-rate-limit, express-mongo-sanitize |

## Architecture Overview
The application follows a standard MERN stack monolith-repo structure:
- `client/`: React frontend initialized via Vite. Contains main SPA logic (`App.jsx`), dedicated views (`pages/`), and UI components.
- `server/`: Node.js/Express backend. Structured into modular layers:
  - `controllers/`: Request handling and business logic.
  - `models/`: Mongoose schemas (Vehicle, Driver, Trip, User, RolePermission, etc.).
  - `routes/`: API endpoint definitions mapped to controllers.
  - `middleware/`: Auth validation and RBAC guards.
  - `scripts/`: Database seeding utilities.

## Business Rules Implemented
- **Unique Vehicle Identifiers**: Enforces unique, case-insensitive vehicle registration numbers.
- **Dispatch Validation**: Prevents assigning 'Suspended' drivers or 'In Shop' vehicles to active trips.
- **Status Integrity**: Automatically hides retired or in-shop vehicles from the dispatch pool.
- **Access Control**: Hardcoded permission checks at both the UI rendering layer and API endpoint layer to prevent unauthorized data access or mutation.
- **Lockout Mechanism**: Enforces temporary lockouts after multiple failed login attempts to prevent brute-force attacks.

## Roles & Permissions

| Role | Fleet | Drivers | Trips | Fuel/Expenses | Analytics | Settings (RBAC) |
|---|---|---|---|---|---|---|
| **Fleet Manager** | Edit | Edit | Hidden | Hidden | Hidden | Edit |
| **Dispatcher** | View | Hidden | Edit | Edit | Edit | Hidden |
| **Safety Officer** | Hidden | View | Hidden | Hidden | Hidden | Hidden |
| **Financial Analyst**| View | Hidden | Hidden | View | Edit | Hidden |

## Getting Started / Setup Instructions

1. Clone the repo
2. cd server && npm install
3. cd ../client && npm install
4. Copy `server/.env.example` to `server/.env` and fill in the required variables (see below).
5. (from `/server`) `npm run seed` — populates demo data + 4 default users
6. (from `/server`) `npm run dev` — starts backend using nodemon
7. (from `/client`) `npm run dev` — starts frontend using Vite

## Demo / Test Credentials
The `npm run seed` script provisions the following accounts:

| Role | Email | Password |
|---|---|---|
| Fleet Manager | fleetmanager@transitops.io | Password@123 |
| Dispatcher | dispatcher@transitops.io | Password@123 |
| Safety Officer | safety@transitops.io | Password@123 |
| Financial Analyst | finance@transitops.io | Password@123 |

## Environment Variables
The following variables are read from `process.env` in the `server` directory:

| Variable | Required | Description |
|---|---|---|
| MONGO_URI | Yes | MongoDB connection string (e.g., mongodb://localhost:27017/transitops) |
| JWT_SECRET | Yes | Secret used for signing JWT cookies |
| PORT | No | Server port, defaults to 5000 if not specified |
| NODE_ENV | No | Environment type (development/production) |

## API Overview
*Note: Most endpoints require a valid JWT cookie and specific RBAC permissions.*

| Module | Endpoints | Purpose |
|---|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/logout` | Authentication and session management. |
| Vehicles | `GET /api/vehicles`, `POST /api/vehicles`, `PATCH /api/vehicles/:id`, `DELETE /api/vehicles/:id` | Manage the fleet registry. |
| Drivers | `GET /api/drivers`, `POST /api/drivers`, `PATCH /api/drivers/:id`, `DELETE /api/drivers/:id` | Manage driver profiles and compliance. |
| Trips | `GET /api/trips`, `POST /api/trips`, `PATCH /api/trips/:id` | Dispatch and monitor trips. |
| Maintenance | `GET /api/maintenance`, `POST /api/maintenance` | Log vehicle services and repairs. |
| Fuel & Expenses | `GET /api/fuel`, `GET /api/expenses`, `POST /api/...` | Track operational costs. |
| Settings | `GET /api/settings/rbac`, `PUT /api/settings/rbac` | Retrieve and update the dynamic RBAC matrix. |

## Screenshots

![Dashboard](./docs/screenshots/dashboard.png)
![Trip Dispatcher](./docs/screenshots/trip-dispatcher.png)

## Known Limitations / Deferred Features
- PDF/CSV exports for reports are not currently implemented.
- Automated email or SMS reminders for expiring driver licenses are deferred.
- Advanced refresh-token rotation is out of scope for this hackathon prototype (relying on simple short-lived JWTs).

## Team
- *Daksh Patel*
- *Yash Shayani*
