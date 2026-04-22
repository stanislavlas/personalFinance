# Mobile App - Personal Finance

Expo React Native mobile app for iOS and Android.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Backend URL

Create/edit `.env` file:

**Linux/macOS:**
```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080
```

**Windows WSL2:**
```env
# Use your Windows PC IP (not WSL IP)
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080
```

**Finding your IP:**
- macOS: `ipconfig getifaddr en0`
- Linux: `hostname -I | awk '{print $1}'`
- Windows: `ipconfig` (look for IPv4 Address under your network adapter)

### 3. Start Dev Server

```bash
npx expo start
```

### 4. Open on Phone

1. Install **Expo Go** app from Google Play or App Store
2. Scan QR code from terminal with Expo Go
3. App loads on your phone

**Important:** Phone and computer must be on same WiFi network.

## Configuration

### Backend URL

The app reads backend URL from environment variable:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080
```

**Do NOT use `localhost` or `127.0.0.1`** - these refer to the phone itself, not your computer.

**Windows WSL2 Users:** Use your Windows PC's network IP, not the WSL IP. WSL port forwarding must be set up (see main README).

### Offline Mode

The app caches data in AsyncStorage for offline access:
- User credentials (access token, refresh token)
- Entries (optimistic updates)
- Categories (fetched from API, cached locally)

Changes made offline are synced when connection is restored.

## Development

### Start Dev Server

```bash
# Normal start
npx expo start

# Clear cache
npx expo start --clear

# Start in tunnel mode (for network issues)
npx expo start --tunnel
```

### Run on Emulator

**Android:**
```bash
npx expo start --android
```

**iOS (macOS only):**
```bash
npx expo start --ios
```

### Development Menu

On physical device:
- **Android:** Shake device
- **iOS:** Shake device or press Cmd+D (when connected to Mac)

Menu options:
- Reload - Reload JavaScript bundle
- Debug Remote JS - Open debugger in Chrome
- Show Performance Monitor - FPS counter
- Show Element Inspector - React DevTools

## Project Structure

```
mobile/
├── App.jsx                   # Root - auth gate, tab navigation, month picker
├── .env                      # Backend URL (not committed)
├── app.json                  # Expo configuration
├── package.json
│
├── app/screens/              # Main screens
│   ├── AuthScreen.jsx        # Login/register
│   ├── DashboardScreen.jsx   # Overview, totals, charts
│   ├── AddScreen.jsx         # Create entry form
│   ├── HistoryScreen.jsx     # Entry list with search/filter
│   ├── CategoriesScreen.jsx  # Manage custom categories
│   ├── HouseholdScreen.jsx   # Create/manage household
│   └── AccountScreen.jsx     # Settings, password, logout
│
└── src/
    ├── hooks/
    │   ├── useAuth.js        # Authentication state + AsyncStorage
    │   ├── useEntries.js     # Entry management + optimistic updates
    │   ├── useHousehold.js   # Household state
    │   └── useCategories.js  # Category management
    │
    ├── services/
    │   ├── auth.js           # JWT auth + token refresh
    │   ├── dynamodb.js       # Entry CRUD
    │   ├── household.js      # Household operations
    │   └── customCategories.js # Category CRUD
    │
    └── utils/
        ├── categories.js     # Category documentation (data now in DB)
        ├── enums.js          # API/UI type mappings
        └── theme.js          # Colors, styles, formatters
```

## Features

### Authentication
- JWT-based auth with automatic token refresh
- Credentials stored securely in AsyncStorage
- Auto-login on app restart (if tokens valid)

### Entries (Transactions)
- Create income/expense/investment entries
- Tag with custom categories
- Mark as NEED or WANT (for expenses)
- Filter by month
- Household-scoped entries (if member of household)
- Optimistic updates (instant UI, syncs in background)

### Categories
- 20 default categories (4 income, 16 expense) auto-seeded by backend on first use
- Create unlimited custom categories with emojis & colors
- Organized by type (income/expense/investment)
- Stored in DynamoDB per-user (or per-household)
- Fetched from API and cached locally in AsyncStorage

### Households
- Share budget with family/roommates
- Owner can add/remove members by email
- All members see all household entries
- Household entries show author name
- Members can leave, owner must delete or transfer

### Dashboard
- Total income/expenses/investments for selected month
- Saved amount calculation
- Needs vs Wants breakdown (for expenses)
- Expenses grouped by category
- Recent entries list

### Offline Support
- Cached user credentials
- Optimistic entry updates
- Works without internet after initial load
- Auto-syncs when connection restored

## Building for Production

### Standalone APK (Android)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK
eas build --platform android --profile preview

# Build AAB for Google Play
eas build --platform android --profile production
```

### iOS Build (requires macOS + Apple Developer account)

```bash
eas build --platform ios --profile production
```

### Local Build (without EAS)

```bash
# Android APK
npx expo export:android

# iOS IPA (macOS only)
npx expo export:ios
```

## Troubleshooting

### App stuck on loading screen

1. Check backend is reachable from phone:
   - Open phone browser
   - Navigate to `http://<YOUR_IP>:8080/api/categories`
   - Should see `401 Unauthorized` (this is good - backend is reachable)

2. If not reachable:
   - Verify phone and computer on same WiFi
   - Update `.env` with correct IP
   - Kill and restart Expo: `pkill -f "expo start" && npx expo start --clear`

3. On phone, shake device → "Reload"

### "Unable to connect to Metro bundler"

Metro bundler is the JavaScript bundler that serves your app code.

**Fix:**
```bash
# Kill all Expo/Metro processes
pkill -f "expo start"
pkill -f "Metro"

# Start fresh
npx expo start --clear
```

**If still doesn't work, try tunnel mode:**
```bash
# Requires @expo/ngrok
npx expo start --tunnel
```

Tunnel mode uses a cloud proxy to bypass local network issues.

### "Network request failed"

App loaded but API calls fail.

**Fix:**
1. Check backend is running: `curl http://<YOUR_IP>:8080/api/categories`
2. Check `.env` has correct IP (not `localhost`)
3. On phone, shake → "Reload" after updating `.env`

### Windows WSL2 - Phone can't reach backend

**Fix port forwarding:**

```powershell
# In Windows PowerShell (Administrator)
# Get WSL IP
wsl hostname -I

# Add port forward
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=<WSL_IP>

# Allow firewall
New-NetFirewallRule -DisplayName "WSL Backend" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

Then use your Windows PC IP in `.env` (not WSL IP).

### Package version conflicts

```bash
# Fix package versions for Expo SDK
npx expo install --fix

# Or reinstall everything
rm -rf node_modules package-lock.json
npm install
```

### App crashes on startup

```bash
# Check Expo logs
npx expo start

# Look for error messages in red text
# Common causes:
# - Missing dependencies (run npm install)
# - Incompatible package versions (run npx expo install --fix)
# - JavaScript syntax errors (check terminal output)
```

## Environment Variables

Available environment variables (set in `.env`):

```env
# Backend API URL (required)
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080
```

**Note:** Expo environment variables must start with `EXPO_PUBLIC_` prefix to be accessible in JavaScript.

## Testing

Currently no automated tests. Manual testing checklist:

- [ ] Register new account
- [ ] Login with existing account
- [ ] Create custom category
- [ ] Add income entry
- [ ] Add expense entry (NEED)
- [ ] Add expense entry (WANT)
- [ ] View dashboard (check totals)
- [ ] Filter by month
- [ ] Create household
- [ ] Add member by email
- [ ] View household entries
- [ ] Remove member
- [ ] Leave household
- [ ] Change password
- [ ] Logout
- [ ] Login again (cached credentials)
- [ ] Delete account

## Dependencies

- React Native 0.76.9
- Expo SDK 52
- @react-native-async-storage/async-storage 1.23.1
- @react-navigation/native ^6.x
- @react-navigation/stack ^6.x

## Performance

- App bundle size: ~5 MB (JavaScript only, excludes Expo Go)
- First load: ~2-3 seconds (loads categories, entries)
- Subsequent loads: <1 second (cached data)
- API response time: ~50-200ms (LocalStack)

## Security Notes

- Tokens stored in AsyncStorage (secure on-device storage)
- Access tokens expire after 15 minutes
- Refresh tokens expire after 30 days
- No sensitive data cached (passwords never stored)
- HTTPS strongly recommended for production

## Support

For issues:
1. Check troubleshooting section above
2. View Expo logs: `npx expo start` (look for red error messages)
3. Check backend logs: Backend must be running
4. Verify network connectivity: Phone must reach backend IP

## License

MIT
