# AGENTS.md

## Repo layout

| Directory | What it is |
|-----------|-----------|
| `backend/` | Kotlin 1.9.25 / Spring Boot 3.3.4 REST API |
| `mobile/` | Expo SDK 54 / React Native 0.81.5 app |
| `bruno/` | Bruno API collection (local dev testing) |
| `docker-compose.yml` | Spins up LocalStack (DynamoDB only) |

No CI workflows exist. No pre-commit hooks.

---

## Critical: docker-compose vs. docs discrepancy

The docs throughout claim LocalStack listens on port **4566** and region **eu-central-1**. The actual `docker-compose.yml` differs:

| Setting | `docker-compose.yml` (truth) | Docs say |
|---------|------------------------------|----------|
| Host port | **4567** | 4566 |
| Container name | **myLocalstack** | localstack |
| Region | **us-west-2** | eu-central-1 |

`application.properties` defaults to `http://localhost:4566` — this will not connect to the compose container without overriding `AWS_URL=http://localhost:4567`.

When verifying DynamoDB from the host, use port **4567**:
```bash
docker exec myLocalstack aws dynamodb list-tables \
  --endpoint-url http://localhost:4566 \
  --region us-west-2
```
(Inside the container the AWS CLI still hits 4566; on the host you reach it via 4567.)

---

## Backend

**Java toolchain:** 21 (build.gradle.kts line 13). The root README incorrectly says Java 17.

```bash
# Start (from backend/)
./gradlew bootRun

# Build
./gradlew build

# Production JAR → build/libs/backend-0.0.1-SNAPSHOT.jar
./gradlew bootJar

# Tests
./gradlew test
```

**Config file:** `backend/application.properties` (checked in, not gitignored).  
Key env-var overrides: `JWT_SECRET`, `AWS_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.  
Default `jwt.secret` is `change-me-default` — only safe for local dev.

**DynamoDB region in application.properties:** `eu-central-1` — must match whatever region LocalStack is configured with (currently `us-west-2` in compose). Set `aws.region` or override via env to match.

**Category seeding:** Default categories are auto-seeded the first time a user calls `GET /api/categories`. For existing users, run:
```bash
cd backend
./scripts/seed-categories.sh <userId-uuid>
```

**Package structure:** `backend/src/main/kotlin/personalFinance/` — modules: `auth`, `category`, `entry`, `household`, `dashboard`, `dataStore`, `config`, `models`, `user`, `common`, `health`.

---

## Mobile

```bash
# Install deps (from mobile/)
npm install

# Dev server
npx expo start

# Clear Metro cache
npx expo start --clear

# Android emulator
npx expo start --android
```

**Backend URL config:** `mobile/.env` — variable must be `EXPO_PUBLIC_API_BASE_URL`. Never use `localhost` (refers to the phone). Use the machine's LAN IP.  
The `.env` file is gitignored. `.env.local` also exists and is loaded first by Expo.

**Do not commit `.env` or `.env.local`** — both are excluded by `.gitignore`.

**Actual versions** (from `package.json`): Expo SDK ~54, React Native 0.81.5, React 19.1.0. README says SDK 52 / RN 0.76.9 — those are stale.

---

## LocalStack / DynamoDB

```bash
# Start (from project root)
docker-compose up -d

# Tables are created automatically by backend/scripts/init-dynamodb.sh
# mounted at /etc/localstack/init/ready.d inside the container

# Verify tables (5 expected: users, refresh_tokens, categories, households, entries)
docker exec myLocalstack aws dynamodb list-tables \
  --endpoint-url http://localhost:4566 --region us-west-2

# Reset everything
docker-compose down && docker-compose up -d
```

**WSL2 line-ending fix** (required if init script fails):
```bash
dos2unix backend/scripts/init-dynamodb.sh
docker-compose restart myLocalstack
```

---

## No automated tests for mobile

The mobile app has no test suite. Backend tests run with `./gradlew test`.

---

## Bruno API collection

`/bruno` folder contains the full API collection. Select the `Local` environment. Running `Auth > Register` auto-saves tokens to env vars for subsequent requests.
