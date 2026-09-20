# CivicLens AI — Backend

**See a problem. Report it. Get it resolved.**

CivicLens AI converts citizen civic complaints into structured, prioritized, and actionable
issues using AI. This repository contains **only the backend** — a standalone, independently
runnable REST API. No frontend is included; connect any frontend (React, Vite, plain HTML,
mobile app, etc.) by pointing it at this API.

Workflow: **REPORT → UNDERSTAND → PRIORITIZE → CLUSTER → ASSIGN → RESOLVE → VERIFY → IMPACT**

---

## 1. Architecture

Clean, layered architecture:

```
Routes  →  Controllers  →  Services  →  Models
```

- **Routes** (`src/routes`) — define endpoints, wire up middleware (multer uploads).
- **Controllers** (`src/controllers`) — parse/validate requests, orchestrate services, shape responses.
- **Services** (`src/services`) — business logic: AI analysis, fallback AI, similarity/duplicate detection.
- **Models** (`src/models`) — Mongoose schemas: `User`, `Issue`, `IssueCluster`, `Resolution`, `ActivityLog`.
- **Utils** (`src/utils`) — pure helper functions: priority engine, text/keyword utilities, API errors.
- **Middleware** (`src/middleware`) — file uploads (multer), centralized error handling, async wrapper.
- **Seed** (`src/seed`) — populates the database with realistic demo data.

```
backend/
  src/
    config/       db.ts, constants.ts
    controllers/  issue.controller.ts, cluster.controller.ts, dashboard.controller.ts
    models/       User.ts, Issue.ts, IssueCluster.ts, Resolution.ts, ActivityLog.ts
    routes/       issue.routes.ts, cluster.routes.ts, dashboard.routes.ts, index.ts
    services/     ai.service.ts, fallbackAI.service.ts, similarity.service.ts
    middleware/   upload.middleware.ts, errorHandler.ts, asyncHandler.ts
    utils/        priorityEngine.ts, textUtils.ts, apiError.ts
    seed/         seed.ts
    app.ts
    server.ts
  uploads/        (created automatically; stores uploaded images)
  package.json
  tsconfig.json
  .env.example
```

---

## 2. Database (MongoDB / Mongoose)

### User
`name, email, role (CITIZEN | AUTHORITY), createdAt`

### Issue
`title, description, category, image, location, latitude, longitude, severity, urgencyScore,
priorityScore, priorityLevel, safetyRisk, affectedPeopleEstimate, department, recommendedAction,
keywords, reasoning, confidence, status, reporterId, clusterId, assignedTo, createdAt, updatedAt`

### IssueCluster
`title, category, location, reportIds[], reportCount, priorityScore, status, createdAt, updatedAt`

### Resolution
`issueId, notes, beforeImage, afterImage, verified, confidence, verificationReason, resolvedBy, createdAt`

### ActivityLog
`issueId, action, description, performedBy, createdAt`

**Categories:** Roads, Waste Management, Water, Electricity, Street Lighting, Drainage, Public Safety,
Public Transport, Environment, Other

**Statuses:** REPORTED, VERIFIED, ASSIGNED, IN_PROGRESS, RESOLVED, REJECTED

**Priority levels:** LOW (0–39), MEDIUM (40–69), HIGH (70–89), CRITICAL (90–100)

---

## 3. AI Architecture

`src/services/ai.service.ts` is the single entry point used by controllers. It:

1. Checks whether `GEMINI_API_KEY` is set in the environment.
2. If set, calls the Gemini API (`gemini-1.5-flash`) with a structured prompt and validates the
   JSON response against the expected schema (valid category/severity/safetyRisk enums, numeric
   ranges, etc.).
3. If the key is **missing**, the Gemini call **fails**, **times out**, or the response is
   **invalid/malformed**, it automatically and silently falls back to
   `src/services/fallbackAI.service.ts` — a deterministic, keyword-based classifier that requires
   no external API and keeps the app **fully functional with zero configuration**.

The API key is read only from environment variables server-side and is **never included in any
API response** sent to the client.

### Fallback AI keyword rules
| Keywords | Category |
|---|---|
| pothole, road, crack | Roads |
| garbage, waste, dumping | Waste Management |
| water, leak, pipe | Water |
| streetlight, lamp, dark | Street Lighting |
| manhole, accident, danger | Public Safety |
| drain, flood, drainage | Drainage |

The fallback engine also generates a realistic severity, urgency score, safety risk, department,
and recommended action per category, with a small escalation boost when danger-related words
(e.g. "accident", "child", "school") appear in the description.

### Priority Engine (`src/utils/priorityEngine.ts`)
`calculatePriority()` combines weighted factors into a single 0–100 score:

- Severity (32%)
- Urgency score (24%)
- Safety risk (22%)
- Affected people estimate, log-scaled (12%)
- Similar/duplicate report count (7%)
- Issue age (3%, capped)

Returns both the numeric `priorityScore` and a `priorityLevel` (LOW/MEDIUM/HIGH/CRITICAL).

### Duplicate Detection & Clustering (`src/services/similarity.service.ts`)
A practical heuristic — **no vector database, no extra infrastructure**:

- Category match (35%)
- Keyword overlap via Jaccard similarity (35%)
- Description text overlap (15%)
- Location proximity via Haversine distance, within 1.5 km (15%)

Issues scoring above the threshold (0.45) are linked to an existing `IssueCluster` or used to
create a new one.

---

## 4. Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/civiclens
GEMINI_API_KEY=
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

`GEMINI_API_KEY` is **optional**. Leave it blank to run entirely on the fallback AI.

---

## 5. Installation

Requires **Node.js 18+** (native `fetch`/`AbortController` used for the Gemini API call) and a
running MongoDB instance (local or Atlas).

```bash
cd backend
cp .env.example .env
npm install
```

## 6. Running Locally

```bash
npm run dev
```

Starts the API with hot-reload at `http://localhost:5000` (or your configured `PORT`).

## 7. Building for Production

```bash
npm run build
npm start
```

## 8. Seeding the Database

```bash
npm run seed
```

This clears existing collections and inserts:
- 8 users (5 citizens, 3 authority accounts)
- 20 realistic civic issues across all categories, statuses, and priority levels
- 3 issue clusters (duplicate reports grouped together)
- A resolution record for a resolved issue
- Realistic activity logs for every issue's lifecycle

---

## 9. API Routes

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check + current AI mode |
| POST | `/issues` | Create issue (full pipeline: analyze → prioritize → cluster) |
| GET | `/issues` | List issues (filters: `status`, `category`, `priorityLevel`, `clusterId`, `search`; pagination: `page`, `limit`) |
| GET | `/issues/similar` | Find similar issues before submitting (query: `description`, `category`, `latitude`, `longitude`) |
| GET | `/issues/:id` | Get a single issue (includes activity log + resolution) |
| PUT | `/issues/:id` | Update an issue |
| POST | `/issues/:id/analyze` | Re-run AI analysis on an existing issue |
| POST | `/issues/:id/verify` | Verify a proposed resolution (accepts `afterImage`, `notes`) |
| POST | `/issues/:id/resolve` | Mark resolved, create `Resolution` record |
| GET | `/clusters` | List issue clusters (filters: `status`, `category`) |
| GET | `/dashboard/stats` | Dashboard metrics |
| GET | `/dashboard/analytics` | Category/status/priority breakdowns + resolution trend |

Uploaded images are served statically from `/uploads/<filename>`.

### Example: Create an issue

```bash
curl -X POST http://localhost:5000/api/issues \
  -F "description=Large pothole near the bus stop, very dangerous at night" \
  -F "location=MG Road" \
  -F "latitude=12.9756" \
  -F "longitude=77.6068" \
  -F "image=@/path/to/photo.jpg"
```

Response (abbreviated):
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Large pothole near the bus stop",
    "category": "Roads",
    "severity": "HIGH",
    "urgencyScore": 87,
    "priorityScore": 82,
    "priorityLevel": "HIGH",
    "safetyRisk": "HIGH",
    "status": "REPORTED",
    "imageUrl": "http://localhost:5000/uploads/image-172...jpg",
    "aiSource": "fallback",
    "similarIssuesFound": 0
  }
}
```

### Example: Resolve an issue

```bash
curl -X POST http://localhost:5000/api/issues/<issueId>/resolve \
  -F "notes=Pothole filled and road resurfaced by maintenance crew" \
  -F "afterImage=@/path/to/after.jpg"
```

### Example: Dashboard stats

```bash
curl http://localhost:5000/api/dashboard/stats
```

```json
{
  "success": true,
  "data": {
    "totalIssues": 20,
    "openIssues": 9,
    "inProgress": 3,
    "resolvedIssues": 1,
    "criticalIssues": 2,
    "resolutionRate": 5,
    "citizensImpacted": 500
  }
}
```

---

## 10. Error Handling

Centralized in `src/middleware/errorHandler.ts`. Handles:
- Validation errors (Mongoose `ValidationError`)
- Malformed IDs (Mongoose `CastError`)
- Duplicate key errors (MongoDB code 11000)
- File upload errors (Multer errors, invalid file types)
- Database connectivity errors
- 404 for unmatched routes
- Generic 500 fallback — **stack traces are never returned when `NODE_ENV=production`**

---

## 11. Notes

- CORS is restricted to `CORS_ORIGIN` (defaults to `http://localhost:5173`).
- Images are stored locally in `backend/uploads/` via Multer — no Cloudinary or S3 required.
- The backend runs and serves all endpoints correctly even with **no MongoDB connection and no
  GEMINI_API_KEY** configured, though issue persistence obviously requires MongoDB to be reachable.
