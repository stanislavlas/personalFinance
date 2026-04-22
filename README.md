# Personal Finance App

Full-stack personal finance tracker with **Kotlin/Spring Boot backend** and **Expo React Native mobile app**.

## Features

- 💰 **Income, Expense & Investment Tracking** - Categorize all your transactions
- 🏷️ **Dynamic Categories** - Create custom categories with emojis and colors (8 defaults auto-seeded)
- 🏠 **Household Sharing** - Share budget with family members (owner/member roles)
- 📊 **Dashboard Analytics** - View totals, needs vs wants, category breakdowns
- 🔐 **JWT Authentication** - Access tokens (15 min) + refresh tokens (30 days)
- 📱 **Mobile-First** - Built with Expo for Android & iOS
- 🗄️ **DynamoDB + LocalStack** - Local development with AWS-compatible database

---

## Architecture

```
personalFinance/
├── backend/          # Kotlin Spring Boot REST API
├── mobile/           # Expo React Native app
├── bruno/            # API collection for testing
└── docker-compose.yml
```

**Backend Stack:**
- Kotlin 1.9.25
- Spring Boot 3.3.4
- DynamoDB (via AWS SDK for Kotlin)
- JWT (jjwt 0.11.5)
- BCrypt password hashing

**Frontend Stack:**
- React Native + Expo SDK 52
- AsyncStorage for offline caching
- React Navigation

**Infrastructure:**
- LocalStack (DynamoDB local)
- Docker Compose

---

## Quick Start

### Prerequisites

**Linux/macOS:**
```bash
# Java 17+ (for backend)
java -version

# Node.js 18+ (for mobile)
node -v

# Docker & Docker Compose (for LocalStack)
docker --version
docker-compose --version
```

**Windows (WSL2):**
```bash
# Install WSL2 with Ubuntu
wsl --install

# Inside WSL, install Java 17
sudo apt update
sudo apt install openjdk-17-jdk

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker Desktop for Windows and enable WSL2 integration
# https://docs.docker.com/desktop/windows/wsl/

# Fix line endings for shell scripts (required for WSL)
sudo apt install dos2unix
cd /path/to/personalFinance
find . -name "*.sh" -type f -exec dos2unix {} \;
```

### 1. Start LocalStack (DynamoDB)

```bash
# Start LocalStack container
docker-compose up -d

# Wait for initialization (tables are auto-created by init script)
sleep 10

# Verify tables were created (should show 5 tables)
docker exec localstack aws dynamodb list-tables \
  --endpoint-url http://localhost:4566 \
  --region eu-central-1
```

**Expected output:**
```json
{
    "TableNames": [
        "categories",
        "entries",
        "households",
        "refresh_tokens",
        "users"
    ]
}
```

The init script (`backend/scripts/init-dynamodb.sh`) automatically creates these 5 tables on startup.

**If you don't see 5 tables, see the troubleshooting section below.**

### 2. Start Backend

**Linux/macOS:**
```bash
cd backend
./gradlew bootRun
```

**Windows (WSL2):**
```bash
cd backend
# Make gradlew executable
chmod +x gradlew
./gradlew bootRun
```

Backend runs on `http://localhost:8080`

API endpoints:
- `POST /api/auth/create` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/categories` - List categories
- `POST /api/entries` - Create entry
- `GET /api/dashboard` - Get analytics
- See `/bruno` folder for full collection

### 3. Start Mobile App

```bash
cd mobile
npm install
npx expo start
```

Scan QR code with **Expo Go** app (Android/iOS) to load the app on your phone.

**Important:** Phone and computer must be on the same WiFi network.

---

## Configuration

### Backend Configuration

Edit `backend/src/main/resources/application.properties`:

```properties
# Server
server.port=8080

# AWS/LocalStack
aws.region=eu-central-1
aws.url=http://localhost:4566

# JWT
jwt.secret=your-secret-key-min-256-bits-change-this-in-production
jwt.expiration=900000  # 15 minutes
```

### Mobile Configuration

Edit `mobile/.env`:

```env
# Linux/macOS - use computer's local IP
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080

# Windows WSL2 - use Windows PC IP (not WSL IP)
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080
```

**Finding your IP address:**
- **macOS:** `ipconfig getifaddr en0`
- **Linux:** `hostname -I | awk '{print $1}'`
- **Windows:** `ipconfig` (look for IPv4 Address)
- **Windows WSL2:** Use Windows IP, not WSL IP (WSL IP changes on restart)

---

## Windows WSL2 Setup

### Port Forwarding (Required for mobile access)

If your phone cannot reach the backend via Windows IP:

```powershell
# Run in Windows PowerShell as Administrator
# Get WSL IP
wsl hostname -I

# Forward port 8080 from Windows to WSL
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=<WSL_IP>

# Example:
# netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=172.20.10.5

# Allow through Windows Firewall
New-NetFirewallRule -DisplayName "WSL Backend" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

Then use your Windows PC's IP in mobile `.env`:
```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080
```

### WSL IP Changes on Restart

WSL IP changes every time you restart WSL or Windows. Update port forward:

```powershell
# Get new WSL IP
wsl hostname -I

# Remove old forward
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=0.0.0.0

# Add new forward with new IP
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=<NEW_WSL_IP>

# View current forwards
netsh interface portproxy show all
```

### Docker in WSL2

Docker Desktop for Windows with WSL2 integration is recommended:
1. Install Docker Desktop: https://docs.docker.com/desktop/windows/install/
2. Enable WSL2 integration in Docker Desktop settings
3. Select your Ubuntu distribution in "Resources > WSL Integration"

---

## Database Schema

### Tables

**users**
- PK: `userId` (UUID)
- GSI: `email-index` (email)
- Attributes: name, email, passwordHash, currency, householdId, householdRole

**refresh_tokens**
- PK: `tokenId` (UUID)
- GSI: `userId-index`
- TTL: `expiresAt`
- Attributes: userId, tokenHash (bcrypt), createdAt, deviceInfo

**categories**
- PK: `categoryId` (UUID)
- GSI: `userId-index`, `householdId-index`
- Attributes: name, emoji, color, type (INCOME/EXPENSE/INVESTMENT), isDefault, createdAt

**Category Seeding:**
- Default categories (4 income, 16 expense) are automatically seeded when a user first calls `GET /api/categories`
- For existing users or manual seeding, use `backend/scripts/seed-categories.sh <userId>`
- Categories are stored per-user (or per-household) and can be customized

**households**
- PK: `householdId` (UUID)
- GSI: `ownerId-index`
- Attributes: name, ownerId, members (List), inviteCode

**entries**
- PK: `entryId` (UUID)
- GSI: `userId-date-index` (userId, date), `householdId-date-index` (householdId, date)
- Attributes: userId, householdId, amount, categoryId, date, name, note, type, necessity (NEED/WANT), authorName, createdAt

---

## Testing with Bruno

[Bruno](https://www.usebruno.com/) API collection is in `/bruno` folder.

1. Install Bruno
2. Open collection: `File > Open Collection > /path/to/bruno`
3. Select `Local` environment
4. Run `Auth > Register` to create account
5. Tokens are automatically saved to environment variables
6. Test other endpoints (Categories, Entries, Households, Dashboard)

---

## Development

### Backend

```bash
# Build
./gradlew build

# Run tests
./gradlew test

# Clean build
./gradlew clean build

# Run in debug mode
./gradlew bootRun --debug-jvm
```

### Mobile

```bash
# Start dev server
npx expo start

# Start on Android emulator
npx expo start --android

# Clear cache
npx expo start --clear

# Build APK (requires Expo account)
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

### Database

```bash
# Reset LocalStack and recreate tables
docker-compose down
docker-compose up -d

# View LocalStack logs
docker-compose logs -f localstack

# Access DynamoDB CLI (inside LocalStack container)
docker exec -it localstack aws dynamodb list-tables --endpoint-url http://localhost:4566 --region eu-central-1

# Scan a table
docker exec -it localstack aws dynamodb scan --table-name users --endpoint-url http://localhost:4566 --region eu-central-1
```

---

## Project Structure

### Backend

```
backend/src/main/kotlin/personalFinance/
├── auth/                     # Authentication & JWT
│   ├── AuthController.kt     # Login, register, refresh, logout
│   ├── AuthService.kt        # User management, password hashing
│   ├── JwtAuth.kt            # Token generation & validation
│   └── RefreshTokenService.kt
├── category/                 # Dynamic categories
│   ├── CategoryController.kt
│   └── CategoryService.kt    # Seeds 26 default categories
├── entry/                    # Transactions (income/expense/investment)
│   ├── EntryController.kt
│   └── EntryService.kt
├── household/                # Shared budgets
│   ├── HouseholdController.kt
│   └── HouseholdService.kt   # Member management, invite codes
├── dashboard/                # Analytics
│   ├── DashboardController.kt
│   └── DashboardService.kt   # Aggregations, needs vs wants
├── dataStore/                # DynamoDB repositories
│   ├── DynamoClient.kt       # User data access
│   ├── EntryRepository.kt
│   ├── CategoryRepository.kt
│   ├── HouseholdRepository.kt
│   └── RefreshTokenRepository.kt
├── config/                   # Spring configuration
│   ├── SecurityConfig.kt     # JWT filter, CORS
│   ├── WebConfig.kt          # Request logging
│   └── GlobalExceptionHandler.kt
└── models/                   # Data models
    ├── internal/             # Domain models
    └── api/                  # Request/response DTOs
```

### Mobile

```
mobile/
├── App.jsx                   # Root - auth gate, tab navigation
├── app/screens/              # 7 main screens
│   ├── AuthScreen.jsx        # Login/register
│   ├── DashboardScreen.jsx   # Overview with charts
│   ├── AddScreen.jsx         # Create entry form
│   ├── HistoryScreen.jsx     # Entry list with filters
│   ├── CategoriesScreen.jsx  # Manage custom categories
│   ├── HouseholdScreen.jsx   # Create/manage household
│   └── AccountScreen.jsx     # Settings, logout
└── src/
    ├── hooks/                # React hooks
    │   ├── useAuth.js        # Auth state + AsyncStorage
    │   ├── useEntries.js     # Optimistic updates
    │   ├── useHousehold.js
    │   └── useCategories.js
    ├── services/             # API clients
    │   ├── auth.js           # JWT + token refresh
    │   ├── dynamodb.js       # Entry CRUD
    │   ├── household.js
    │   └── customCategories.js
    └── utils/
        ├── categories.js     # Default categories
        └── theme.js          # Colors, styles
```

---

## Troubleshooting

### Backend won't start

```bash
# Check if LocalStack is running
docker ps | grep localstack

# Check if tables exist
docker exec -it localstack aws dynamodb list-tables --endpoint-url http://localhost:4566 --region eu-central-1

# Restart LocalStack
docker-compose restart localstack

# View initialization logs
docker-compose logs localstack
```

### Tables not created on LocalStack startup

**On WSL, line endings issue causes init script to fail:**

```bash
# Install dos2unix in WSL
sudo apt install dos2unix

# Fix the init script
dos2unix backend/scripts/init-dynamodb.sh

# Restart LocalStack to run fixed script
docker-compose restart localstack

# Verify tables created
docker-compose logs localstack | grep "Creating table"
```

**Or create tables manually:**

```bash
# Run the script manually inside LocalStack container
docker exec -it localstack bash
cd /etc/localstack/init/ready.d
dos2unix init-dynamodb.sh  # if needed
bash init-dynamodb.sh
exit

# Or from host
docker exec -it localstack bash /etc/localstack/init/ready.d/init-dynamodb.sh
```

### Mobile app stuck on loading screen

1. Check backend is accessible from your phone:
   - Open phone browser: `http://<COMPUTER_IP>:8080/api/categories`
   - Should return 401 (unauthorized) - this means backend is reachable
   
2. Update `.env` with correct IP address

3. Restart Expo dev server:
   ```bash
   # Kill existing servers
   pkill -f "expo start"
   
   # Start fresh
   npx expo start --clear
   ```

4. On phone, shake device → "Reload" to reload app with new config

### WSL2 networking issues

**Line endings issue:**

If you get "cannot execute: required file not found" on shell scripts:

```bash
# Install dos2unix
sudo apt install dos2unix

# Fix all shell scripts
cd /path/to/personalFinance
find . -name "*.sh" -type f -exec dos2unix {} \;

# Or fix individual file
dos2unix backend/scripts/init-dynamodb.sh
```

**Port forwarding:**

```powershell
# In Windows PowerShell (Admin)
# View port forwards
netsh interface portproxy show all

# Remove old forwards
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=0.0.0.0

# Get current WSL IP (changes on restart)
wsl hostname -I

# Add new forward with current WSL IP
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=<WSL_IP>
```

### Docker on WSL2

```bash
# Test Docker integration
docker run hello-world

# If Docker daemon not found:
# 1. Open Docker Desktop
# 2. Settings > Resources > WSL Integration
# 3. Enable integration for your Ubuntu distro
# 4. Restart WSL terminal
```

---

## Production Deployment

### Backend

1. **Update JWT secret** in `application.properties` (use 256+ bit random string)
2. **Point to real DynamoDB**: Change `aws.url` to your AWS region endpoint
3. **Set up AWS credentials**: Use IAM role or credentials file
4. **Enable HTTPS**: Add SSL certificate
5. **Build JAR**:
   ```bash
   ./gradlew bootJar
   java -jar build/libs/backend-0.0.1-SNAPSHOT.jar
   ```

### Mobile

1. **Update API URL** in `.env` to production backend
2. **Build standalone app**:
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   eas build --platform android --profile production
   ```
3. **Publish to Google Play Store** or distribute APK

---

## API Documentation

See `/bruno` collection for all endpoints with examples.

**Key Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/create | Register new user |
| POST | /api/auth/login | Login (returns tokens) |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Revoke refresh token |
| GET | /api/categories | List user + household categories |
| POST | /api/categories | Create custom category |
| DELETE | /api/categories/:id | Delete category |
| GET | /api/entries | List entries (filter by month/household) |
| POST | /api/entries | Create entry |
| PUT | /api/entries/:id | Update entry |
| DELETE | /api/entries/:id | Delete entry |
| GET | /api/dashboard | Analytics (totals, needs vs wants) |
| POST | /api/households | Create household |
| GET | /api/households/:id | Get household details |
| POST | /api/households/:id/members | Add member (owner only) |
| DELETE | /api/households/:id/members/:uid | Remove member (owner only) |

All protected endpoints require `Authorization: Bearer <accessToken>` header.

---

## License

MIT

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review backend logs: `./gradlew bootRun` output
3. Check LocalStack logs: `docker-compose logs localstack`
4. Review Expo logs: `npx expo start` output
