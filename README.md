# Ethara — Team Task Management

A full-stack collaborative task management application where teams can create projects, assign tasks, and track progress with strict role-based access control.

Built as a simplified version of tools like Trello and Asana.

## Live Application

| Service  | URL                                                                              |
|----------|----------------------------------------------------------------------------------|
| Frontend | [https://artistic-forgiveness-production-d8a7.up.railway.app](https://artistic-forgiveness-production-d8a7.up.railway.app) |
| Backend  | [https://ethara-taskmanagement-production.up.railway.app/api/v1/health](https://ethara-taskmanagement-production.up.railway.app/api/v1/health) |

### Test Credentials

| Role   | Email                  | Password    |
|--------|------------------------|-------------|
| Admin  | admin@gmail.com        | Test@1234   |
| Member | testuser1@gmail.com    | Test@1234   |
| Member | testuser2@gmail.com    | Test@1234   |

## About the Developer

**Gaurav Thakur**

- Portfolio: [thegauravthakur.in](https://www.thegauravthakur.in/)
- GitHub (main): [github.com/gauravthakur8355](https://github.com/gauravthakur8355)
- GitHub (this repo): [github.com/2405Gaurav](https://github.com/2405Gaurav)

> **Note on GitHub account:** This project is deployed from [@2405Gaurav](https://github.com/2405Gaurav) because the Railway free tier was already used on my main account ([@gauravthakur8355](https://github.com/gauravthakur8355)). Both accounts are mine — the code and commits are by the same person.

---

## Features

### Authentication
- Signup with Name, Email, Password
- JWT-based login with access + refresh token rotation
- Auto-refresh on token expiry (seamless UX)

### Project Management
- Create projects (creator becomes Admin)
- Admin can invite/remove members by email
- Members can only view projects they belong to

### Task Management
- Create tasks with Title, Description, Due Date, Priority
- Assign tasks to project members
- Kanban board with 4 statuses: **TODO → IN_PROGRESS → IN_REVIEW → DONE**
- Strict state machine — no skipping statuses

### Dashboard
- Total tasks and projects
- Tasks by status breakdown
- Tasks per user (workload view)
- Overdue tasks list

### Role-Based Access Control (RBAC)

| Action                      | Admin | Member |
|-----------------------------|:-----:|:------:|
| Create/delete tasks         |  ✅   |   ❌   |
| Assign tasks to users       |  ✅   |   ❌   |
| Start task (TODO → IN_PROGRESS) | ✅ | ✅ (own only) |
| Submit for review           |  ✅   | ✅ (own only) |
| Approve/reject review       |  ✅   |   ❌   |
| View all project tasks      |  ✅   |   ❌   |
| View own assigned tasks     |  ✅   |   ✅   |
| Add/remove members          |  ✅   |   ❌   |

---

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite 8
- TailwindCSS 4
- shadcn/ui (Radix primitives)
- Framer Motion (animations)
- React Query (server state)
- React Router v7

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL (Neon serverless)
- JWT authentication
- Zod validation
- Winston logging
- Helmet + Rate Limiting

### Deployment
- Railway (both services)
- Neon PostgreSQL (database)

---

## Project Structure

```
ethara-taskmanagement/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/             # shadcn/ui primitives
│   │   │   ├── auth/           # Auth guards (ProtectedRoute)
│   │   │   ├── layout/         # AppLayout, Sidebar
│   │   │   ├── project/        # CreateProject, InviteMember modals
│   │   │   └── task/           # KanbanBoard, TaskCard, CreateTask
│   │   ├── context/            # AuthContext
│   │   ├── lib/                # Axios instance, utilities
│   │   ├── pages/              # Route pages
│   │   │   ├── auth/           # Login, Signup
│   │   │   ├── dashboard/      # Dashboard
│   │   │   ├── landing/        # Landing page + sections
│   │   │   └── projects/       # Project list, Project detail
│   │   └── services/           # API service layer
│   └── package.json
│
├── server/                     # Express backend
│   ├── src/
│   │   ├── config/             # env, logger, database
│   │   ├── middleware/         # auth, error, rate-limiter, validate
│   │   ├── modules/            # Feature modules
│   │   │   ├── auth/           # controller, service, routes, validation
│   │   │   ├── project/        # controller, service, routes, validation
│   │   │   ├── task/           # controller, service, routes, validation
│   │   │   ├── dashboard/      # service, routes
│   │   │   └── user/           # routes (search)
│   │   └── shared/             # types, errors, utils, state machine
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   └── package.json
│
└── README.md
```

## Database Design

```
Users ──────── ProjectMembers ──────── Projects
  │                 (role)                 │
  │                                       │
  └──── Tasks ────────────────────────────┘
          │         (status, priority,
          │          assignedTo, createdBy)
          │
       Comments
```

**Key tables:** `users`, `projects`, `project_members` (join with role), `tasks`, `comments`

All IDs are UUIDs. Foreign keys are indexed. Cascade deletes on project/user removal.

---

## Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)

### 1. Clone and install

```bash
git clone https://github.com/2405Gaurav/ethara-taskmanagement.git
cd ethara-taskmanagement

# Install backend
cd server
npm install

# Install frontend
cd ../client
npm install
```

### 2. Configure environment

```bash
# server/.env
cp server/.env.example server/.env
# Fill in DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# client/.env
echo "VITE_API_URL=http://localhost:5000/api/v1" > client/.env
```

### 3. Setup database

```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
```

### 4. (Optional) Seed test data

```bash
npx prisma db seed
```

### 5. Run

```bash
# Terminal 1 — Backend
cd server
npm run dev      # runs on :5000

# Terminal 2 — Frontend
cd client
npm run dev      # runs on :5173
```

---

## API Endpoints

| Method | Endpoint                        | Auth | Description              |
|--------|---------------------------------|------|--------------------------|
| POST   | `/api/v1/auth/register`         | No   | Create account           |
| POST   | `/api/v1/auth/login`            | No   | Login                    |
| POST   | `/api/v1/auth/refresh`          | No   | Refresh tokens           |
| GET    | `/api/v1/auth/me`               | Yes  | Current user profile     |
| GET    | `/api/v1/projects`              | Yes  | List user's projects     |
| POST   | `/api/v1/projects`              | Yes  | Create project           |
| GET    | `/api/v1/projects/:id`          | Yes  | Project details          |
| PATCH  | `/api/v1/projects/:id`          | Yes  | Update project (admin)   |
| DELETE | `/api/v1/projects/:id`          | Yes  | Delete project (creator) |
| POST   | `/api/v1/projects/:id/members`  | Yes  | Add member (admin)       |
| DELETE | `/api/v1/projects/:id/members/:userId` | Yes | Remove member (admin) |
| GET    | `/api/v1/projects/:id/tasks`    | Yes  | Tasks in project         |
| POST   | `/api/v1/tasks`                 | Yes  | Create task (admin)      |
| PATCH  | `/api/v1/tasks/:id`             | Yes  | Update task              |
| DELETE | `/api/v1/tasks/:id`             | Yes  | Delete task (admin)      |
| GET    | `/api/v1/dashboard/stats`       | Yes  | Dashboard statistics     |
| GET    | `/api/v1/users/search?email=`   | Yes  | Search users by email    |
| GET    | `/api/v1/health`                | No   | Health check             |

---

## Deployment (Railway)

Both services are deployed on Railway as separate services from the same monorepo:

**Backend service:**
- Root directory: `/server`
- Build: `npm install && npm run build`
- Start: `npm start`
- Env vars: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `NODE_ENV=production`

**Frontend service:**
- Root directory: `/client`
- Build: `npm install && npm run build`
- Start: `serve -s dist -l tcp://0.0.0.0:${PORT:-3000}`
- Env vars: `VITE_API_URL=https://<backend-url>/api/v1`

---

## License

MIT
