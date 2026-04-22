# Backend - Personal Finance API

Kotlin Spring Boot REST API with DynamoDB (via LocalStack for local development).

## Quick Start

### 1. Start LocalStack

```bash
# From project root
docker-compose up -d

# Wait for initialization
sleep 10

# Verify tables were created (should show 5 tables)
docker exec -it localstack aws dynamodb list-tables --endpoint-url http://localhost:4566 --region eu-central-1
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

**If tables not created:** See "Tables not created" section in troubleshooting below.

### 2. Run Backend

**Linux/macOS:**
```bash
./gradlew bootRun
```

**Windows (WSL2):**
```bash
chmod +x gradlew
./gradlew bootRun
```

Backend runs on `http://localhost:8080`

## Configuration

Edit `src/main/resources/application.properties`:

```properties
# Server
server.port=8080

# AWS/LocalStack
aws.region=eu-central-1
aws.url=http://localhost:4566

# JWT
jwt.secret=your-secret-key-change-this-in-production-minimum-256-bits
jwt.expiration=900000
```

**For Windows WSL2:**
- LocalStack URL stays `http://localhost:4566` (Docker Desktop handles WSL integration)
- To access from mobile app, see WSL2 port forwarding in main README

## Build & Test

```bash
# Build
./gradlew build

# Run tests
./gradlew test

# Clean build
./gradlew clean build

# Build JAR for production
./gradlew bootJar
# Output: build/libs/backend-0.0.1-SNAPSHOT.jar
```

## Database Scripts

Initialize DynamoDB tables (runs automatically on `docker-compose up`):

```bash
# View tables
docker exec -it localstack aws dynamodb list-tables \
  --endpoint-url http://localhost:4566 \
  --region eu-central-1

# Scan users table
docker exec -it localstack aws dynamodb scan \
  --table-name users \
  --endpoint-url http://localhost:4566 \
  --region eu-central-1

# Scan categories for a specific user
docker exec -it localstack aws dynamodb query \
  --table-name categories \
  --index-name userId-index \
  --key-condition-expression "userId = :uid" \
  --expression-attribute-values '{":uid":{"S":"<user-id>"}}' \
  --endpoint-url http://localhost:4566 \
  --region eu-central-1

# Delete all items (useful for testing)
docker exec -it localstack bash
# Inside container:
aws dynamodb scan --table-name users --endpoint-url http://localhost:4566 --region eu-central-1 | \
  jq -r '.Items[] | "{\\"userId\\": {\\"S\\": \\"" + .userId.S + "\\"}}"' | \
  xargs -I {} aws dynamodb delete-item --table-name users --key '{}' --endpoint-url http://localhost:4566 --region eu-central-1
```

### Seeding Categories

Categories are automatically seeded when a user first calls `GET /api/categories`. For existing users or manual seeding:

```bash
# Seed categories for a specific user
./scripts/seed-categories.sh <user-id-uuid>

# Example
./scripts/seed-categories.sh 123e4567-e89b-12d3-a456-426614174000
```

## API Endpoints

Base URL: `http://localhost:8080`

### Authentication
- `POST /api/auth/create` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `DELETE /api/auth/account` - Delete account
- `PUT /api/auth/password` - Change password

### Categories
- `GET /api/categories` - List categories (auto-seeds 20 defaults on first access)
- `POST /api/categories` - Create custom category
- `DELETE /api/categories/:id` - Delete category

**Default categories are automatically seeded when a user first accesses the categories API.**

Income categories (4):
- Salary, Meal Vouchers, Flexi Pass, Invested

Expense categories (16):
- Rent, Energy, Electricity, Internet, Phone, Insurance, Groceries, Household, Transport, Clothing, Multisport, Subscription, Dining Out, Alza, Entertainment, Other

**To seed categories for existing users or test accounts:**
```bash
# Get your userId from the users table or API
USER_ID="<your-user-id-uuid>"

# Run the seeding script
cd backend
./scripts/seed-categories.sh $USER_ID

# Or for multiple users, query DynamoDB and seed each
docker exec -it localstack aws dynamodb scan \
  --table-name users \
  --endpoint-url http://localhost:4566 \
  --region eu-central-1 \
  --query 'Items[].userId.S' \
  --output text | xargs -n1 ./scripts/seed-categories.sh
```

### Entries (Transactions)
- `GET /api/entries?yearMonth=YYYY-MM&householdId=xxx` - List entries
- `POST /api/entries` - Create entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry

### Households
- `POST /api/households` - Create household
- `GET /api/households/:id` - Get household
- `PUT /api/households/:id` - Rename household
- `DELETE /api/households/:id` - Delete household
- `POST /api/households/:id/members` - Add member
- `DELETE /api/households/:id/members/:uid` - Remove member
- `POST /api/households/:id/leave` - Leave household

### Dashboard
- `GET /api/dashboard?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD&householdId=xxx` - Get analytics

## Environment Variables

For production, set these as environment variables instead of application.properties:

```bash
export AWS_REGION=eu-central-1
export AWS_URL=https://dynamodb.eu-central-1.amazonaws.com
export JWT_SECRET=<256-bit-random-string>
export SERVER_PORT=8080
```

## Windows WSL2 Notes

### Finding WSL IP

```bash
# Inside WSL
hostname -I | awk '{print $1}'
# Example output: 172.20.10.5
```

### Port Forwarding (for mobile access)

**In Windows PowerShell (Administrator):**

```powershell
# Get WSL IP
wsl hostname -I

# Forward port 8080
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=172.20.10.5

# Allow firewall
New-NetFirewallRule -DisplayName "WSL Backend" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow

# View forwards
netsh interface portproxy show all

# Delete forward (when WSL IP changes)
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=0.0.0.0
```

### WSL IP Changes on Restart

WSL IP changes every time you restart WSL or Windows. Update port forward after restart:

```powershell
# Get new IP
wsl hostname -I

# Delete old forward
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=0.0.0.0

# Add new forward with new IP
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=<NEW_WSL_IP>
```

## Logs

Application logs include:
- Request/response logging (with timing)
- Exception logging with stack traces
- DynamoDB operation logs

View logs:
```bash
# While running
./gradlew bootRun

# From JAR
java -jar build/libs/backend-0.0.1-SNAPSHOT.jar

# With debug level
java -jar build/libs/backend-0.0.1-SNAPSHOT.jar --logging.level.personalFinance=DEBUG
```

## Testing with Bruno

See `/bruno` folder in project root for complete API collection.

1. Install Bruno: https://www.usebruno.com/
2. Open collection: `/path/to/personalFinance/bruno`
3. Select "Local" environment
4. Run "Auth > Register" to create test account
5. Tokens are auto-saved to environment variables
6. Test other endpoints

## Common Issues

### Port 8080 already in use

```bash
# Find process using port 8080
lsof -i :8080

# Kill it
kill -9 <PID>

# Or change port in application.properties
server.port=8081
```

### LocalStack not accessible

```bash
# Check LocalStack is running
docker ps | grep localstack

# Restart LocalStack
docker-compose restart localstack

# View logs
docker-compose logs localstack
```

### Tables not created

```bash
# Check LocalStack logs for errors
docker-compose logs localstack

# Recreate tables
docker-compose down
docker-compose up -d
sleep 10
docker exec -it localstack aws dynamodb list-tables --endpoint-url http://localhost:4566 --region eu-central-1
```

**On WSL, if you see "cannot execute: required file not found":**

```bash
# Install dos2unix
sudo apt install dos2unix

# Fix line endings
dos2unix backend/scripts/init-dynamodb.sh

# Restart LocalStack
docker-compose restart localstack

# Verify tables created
docker-compose logs localstack | grep "Creating table"
```

**Or create tables manually:**

```bash
# Run init script inside container
docker exec -it localstack bash /etc/localstack/init/ready.d/init-dynamodb.sh
```

### Gradle permission denied (WSL)

```bash
chmod +x gradlew
```

## Production Deployment

1. **Update JWT secret** to 256+ bit random string
2. **Change AWS URL** to real DynamoDB endpoint
3. **Set up IAM credentials**:
   ```bash
   aws configure
   # OR use IAM role for EC2/ECS
   ```
4. **Build production JAR**:
   ```bash
   ./gradlew bootJar
   ```
5. **Run**:
   ```bash
   java -jar build/libs/backend-0.0.1-SNAPSHOT.jar
   ```

## Dependencies

- Kotlin 1.9.25
- Spring Boot 3.3.4
- AWS SDK for Kotlin (DynamoDB)
- jjwt 0.11.5 (JWT)
- Jackson (JSON)
- BCrypt (password hashing)
