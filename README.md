# ft_transcendence

This project started as a minimal full-stack app with Dockerized services and evolved into a secure authentication flow with local login/register and a 42 OAuth-ready backend.

The goal of this README is to explain the project in order:
- what the app looked like at first
- what was added step by step
- which files were created and why
- how to run and configure it in its current state

---

## Step 0: Initial state — no login or registration logic

At the beginning, the app only had:
- a React frontend
- an Express API
- a MongoDB container

There was no authentication flow yet, no user collection, no JWT handling, and no protected routes.

The project structure was essentially:
- `frontend/` for the UI shell
- `backend/` for the API server
- `db/` for MongoDB setup
- `docker-compose.yml` for service orchestration

This stage was useful for verifying the stack could build correctly and that the services could communicate with each other.

---

## Step 1: Add the base Docker stack

The first major setup was the containerized architecture.

### Files involved
- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `db/Dockerfile`
- `db/init-mongo.js`

### Purpose
- run MongoDB, backend, and frontend as separate services
- expose the app on:
  - frontend: http://localhost:8080
  - backend: http://localhost:3000
  - MongoDB: localhost:27017
- ensure the backend starts only after the database is healthy

### Why it matters
This gave us a reproducible development environment and made the project easier to run locally with a single command:

```sh
make up
```

---

## Step 2: Add the backend API and health check

The backend was set up with Express and a basic health endpoint.

### Files involved
- `backend/src/server.ts`
- `backend/package.json`
- `backend/tsconfig.json`

### Purpose
- start the Express server
- connect to MongoDB with Mongoose
- expose `/api/health`
- mount the authentication API under `/api/auth`
- define the app runtime port and DB configuration

### What changed
The backend moved from a static placeholder to a real API layer capable of handling DB connectivity and future auth endpoints.

---

## Step 3: Add the MongoDB user model

A proper authentication system needs a database user model.

### Files involved
- `backend/models/User.ts`

### Purpose
- define the `User` schema
- store:
  - username
  - email
  - password
- hash passwords before saving with `bcryptjs`
- compare submitted passwords during login

### Why it matters
This step introduced the actual persistence layer needed for register/login. Before this, there was no user storage or password hashing.

---

## Step 4: Add JWT auth middleware and auth route structure

Once the database user model existed, the next step was to add authentication logic.

### Files involved
- `backend/middleware/auth.ts`
- `backend/types/index.ts`
- `backend/routes/auth.ts`

### Purpose
- authenticate incoming requests using bearer JWT tokens
- decode and verify tokens
- attach the user payload to the request object
- create secure local auth endpoints for register and login

### What the route handles
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Why this is important
Before this, there was no identity system. This step created the core backend auth flow and allowed the frontend to securely log in and access protected routes.

---

## Step 5: Add local login and registration

The app then gained the classic email/password flow.

### Files involved
- `backend/routes/auth.ts`
- `frontend/context/AuthContext.tsx`
- `frontend/components/Login.tsx`
- `frontend/components/Register.tsx`

### Purpose
- register a new user with username, email and password
- validate credentials during login
- generate a JWT token on successful auth
- persist the auth token and user data in local storage
- send requests to the backend API from the frontend

### Why it matters
This was the first working user authentication flow:
- the frontend sends credentials to the backend
- the backend checks MongoDB
- the backend returns a JWT
- the frontend stores the session and uses it for protected pages

---

## Step 6: Add protected routes and dashboard access

Once auth existed, the app needed to restrict access to parts of the UI.

### Files involved
- `frontend/components/ProtectedRoute.tsx`
- `frontend/App.tsx`

### Purpose
- check whether a user has a valid token
- redirect unauthenticated users to `/login`
- allow only authenticated users to view the dashboard

### What happened
The app evolved from a free access frontend into a gated application where only signed-in users could access the protected area.

---

## Step 7: Improve the frontend UI and user experience

The app was not only functional, it also needed to feel like an actual authentication screen.

### Files involved
- `frontend/src/style.css`
- `frontend/components/Login.tsx`
- `frontend/components/Register.tsx`
- `frontend/App.tsx`

### Purpose
- create a cleaner login/register look
- show proper labels and input fields
- style the dashboard panel
- display profile information such as username and email after login
- make the app feel consistent and polished

---

## Step 8: Add 42 OAuth support (prepared for later production use)

The project also includes a 42 OAuth implementation, but it is intentionally kept ready for later activation when real production credentials are available.

### Files involved
- `backend/routes/auth.ts`
- `frontend/context/AuthContext.tsx`
- `frontend/App.tsx`
- `docker-compose.yml`

### Purpose
- redirect the user to the 42 authorization URL
- exchange the returned authorization code for an access token
- fetch user info from the 42 API
- create or reuse a local user profile
- redirect back to the frontend with a JWT token

### Available endpoints
- `GET /api/auth/oauth/42`
- `GET /api/auth/oauth/42/callback`

### Important note
This flow is implemented and ready, but it is not required for local development right now. It should be enabled only when real values are configured for:
- `FORTY_TWO_CLIENT_ID`
- `FORTY_TWO_CLIENT_SECRET`
- `FORTY_TWO_REDIRECT_URI`

---

## Step 9: Add environment configuration

The app now relies on environment variables for secrets and URLs.

### Files involved
- `.env.example`
- `docker-compose.yml`

### Purpose
- keep secrets out of source control
- configure backend values like JWT secret and DB connection
- configure frontend values like the API URL
- add placeholders for 42 OAuth credentials

### Example variables
```env
PORT=3000
DATABASE_URL=mongodb://db:27017
MONGO_DB=transcendence
JWT_SECRET=change-me-in-production
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:3000
FORTY_TWO_CLIENT_ID=
FORTY_TWO_CLIENT_SECRET=
FORTY_TWO_REDIRECT_URI=http://localhost:3000/api/auth/oauth/42/callback
VITE_API_URL=http://localhost:3000
```

---

## Current project file map and purpose

### Backend
- `backend/src/server.ts`
  Starts the Express app, connects to MongoDB, and mounts the auth routes.

- `backend/routes/auth.ts`
  Contains register, login, profile lookup, and 42 OAuth logic.

- `backend/middleware/auth.ts`
  Verifies JWT tokens and protects endpoints.

- `backend/models/User.ts`
  Stores user data and hashes passwords securely.

- `backend/types/index.ts`
  Defines the custom request shape used by authenticated routes.

- `backend/package.json`
  Defines the backend dependencies and build scripts.

- `backend/tsconfig.json`
  Configures TypeScript for the backend runtime.

- `backend/Dockerfile`
  Builds the backend container image.

### Frontend
- `frontend/App.tsx`
  Main route structure, protected dashboard wiring, and OAuth callback handling.

- `frontend/context/AuthContext.tsx`
  Central auth state, token persistence, login/register actions, and profile loading.

- `frontend/components/Login.tsx`
  Local login form and optional 42 login button.

- `frontend/components/Register.tsx`
  Local sign-up form and optional 42 login button.

- `frontend/components/ProtectedRoute.tsx`
  Blocks unauthenticated users from protected pages.

- `frontend/src/main.tsx`
  Bootstraps the React application.

- `frontend/src/style.css`
  Styles the app and auth screens.

- `frontend/package.json`
  Defines frontend dependencies and scripts.

- `frontend/vite.config.ts`
  Vite configuration for the React frontend.

- `frontend/tsconfig.json`
  TypeScript configuration for frontend development and build.

- `frontend/Dockerfile`
  Builds the frontend production container.

### Database
- `db/init-mongo.js`
  Initializes the MongoDB database for local development.

- `db/Dockerfile`
  Builds the MongoDB container image.

### Root files
- `docker-compose.yml`
  Orchestrates the full multi-service stack.

- `Makefile`
  Provides shortcuts like `make up`, `make down`, `make logs`, etc.

- `.env.example`
  Documents the expected environment variables.

- `README.md`
  Project documentation and architecture history.

---

## How to run the app

From the project root:

```sh
make up
```

Then open:
- frontend: http://localhost:8080
- backend API: http://localhost:3000
- MongoDB: localhost:27017

Useful commands:

```sh
make logs
make ps
make down
make clean
```

---

## Current status

The app currently supports:
- local registration
- local login
- JWT-based protected routes
- authenticated dashboard
- 42 OAuth flow prepared for later production use

