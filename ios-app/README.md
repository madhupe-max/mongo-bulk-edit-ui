# iOS App — Mongo Bulk Edit

React Native (Expo) iOS app that connects to the existing Express/MongoDB backend.

## System Requirements

- macOS with **full Xcode.app** installed (from the Mac App Store) — required for iOS Simulator and building `.app` bundles
- Node.js 18+ (tested on v24.14.0)
- npm 9+

> **Important:** Xcode Command Line Tools alone (`xcode-select --install`) are NOT sufficient. You must have the full Xcode.app (~15 GB) to run the iOS Simulator, build the app, and run Appium tests.

---

## 1. Start the Backend Server

The iOS app calls the Express + MongoDB backend at `http://localhost:5050`.

```bash
cd server
node index.js
# Server runs on http://localhost:5050
# MongoDB connects to bulk_edit_db (records collection)
```

---

## 2. Install iOS App Dependencies

```bash
cd ios-app
npm install
```

If you hit npm cache permission errors (e.g. after a `sudo npm install`), fix them first:

```bash
sudo chown -R $(whoami) ~/.npm
npm install
```

---

## 3. API Configuration

The API base URL is set in `src/services/api.js`:

| Target | URL |
|---|---|
| iOS Simulator | `http://localhost:5050` (default) |
| Physical device | `http://<your-mac-ip>:5050` |

Change `BASE_URL` in `src/services/api.js` when testing on a real device.

---

## 4. Run the App

### Option A — Expo Go (physical device, no Xcode required)

Start the Metro bundler:

```bash
cd ios-app
npx expo start
```

Scan the QR code with the **Camera app** on your iPhone. The app opens in [Expo Go](https://expo.dev/go). No build step needed.

> The Metro server runs on `exp://<your-mac-ip>:8081`. Make sure your iPhone and Mac are on the same Wi-Fi network.

### Option B — iOS Simulator (requires full Xcode.app)

```bash
# Set Xcode as the active developer directory
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept

cd ios-app
npx expo start
# Then press  i  to open the iOS Simulator
```

Or build and launch directly:

```bash
npx expo run:ios
```

---

## 5. Project Structure

```
ios-app/
  App.js                  # Navigation root (NavigationContainer + Stack)
  app.json                # Expo config (bundle ID, iOS permissions)
  babel.config.js
  src/
    services/
      api.js              # Axios instance + fetchRecords, bulkUpdateRecords, fetchRecord
    screens/
      RecordsScreen.js    # Main list — selection, bulk edit panel, refresh, error banner
      RecordDetailScreen.js
    components/
      RecordRow.js        # Tappable row with checkbox and all record fields
      BulkEditPanel.js    # Bulk edit inputs (name, email, status, department)
```

## Features

- **View records** — fetched live from MongoDB via the backend API
- **Select records** — tap rows or use "Select All"
- **Bulk Edit** — update multiple records in one API call
- **Pull-to-refresh** — swipe down on the list to reload
- **Error banners** — inline feedback for API errors
- **testID props** — all interactive elements have `testID` for Appium automation

---

# Appium Tests

WebdriverIO + Appium (XCUITest) end-to-end tests for the iOS app.

## Requirements

- **Full Xcode.app** installed (iOS Simulator + SDK are required by XCUITest driver)
- Node.js 18+ (tested on v24.14.0)
- Appium installed globally (see below)
- XCUITest driver installed (see below)
- A built `.app` bundle (see Step 2 below)

---

## 1. Install Appium Globally

Global npm installs may require fixing permissions first:

```bash
sudo chown -R $(whoami) /usr/local/lib/node_modules /usr/local/bin
npm install -g appium
```

If you still get permission errors, use sudo:

```bash
sudo npm install -g appium
```

---

## 2. Install the XCUITest Driver

```bash
appium driver install xcuitest
# Verify:
appium driver list
# xcuitest should show [installed (npm)]
```

---

## 3. Build the App Bundle

The tests require a compiled `.app` file:

```bash
# Activate full Xcode first (if not already done)
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept

cd ios-app
npx expo run:ios --configuration Debug
```

The bundle will be created at:
```
ios-app/ios/build/Build/Products/Debug-iphonesimulator/MongoBulkEdit.app
```

This path is referenced in `appium-tests/wdio.conf.js` as `IOS_APP_PATH`. Update it if your output path differs.

---

## 4. Install Test Dependencies

```bash
cd appium-tests
npm install
```

> **Note:** If you encounter the error `"ts-node/esm/transpile-only 'resolve'" did not call the next hook`, upgrade ts-node:
> ```bash
> npm install ts-node@latest
> ```
> This is caused by ts-node v9 incompatibility with Node.js v24's strict ESM hooks. ts-node v10+ fixes it.

---

## 5. Start Appium Server

The wdio config connects to an already-running Appium server (it does not auto-start one). Start it manually before running tests:

```bash
appium -p 4723 --relaxed-security &
# Verify it's ready:
curl http://127.0.0.1:4723/status
# Should return: {"value":{"ready":true,...}}
```

---

## 6. Run the Tests

Make sure the backend server is running on port 5050, then:

```bash
cd appium-tests
npm test
# or
npm run test:ios
```

---

## Current Status & Known Blockers

| Component | Status |
|---|---|
| Backend server (Express + MongoDB) | Working — `http://localhost:5050` |
| Expo Metro bundler | Working — `exp://<ip>:8081` |
| Expo Go (physical device) | Working — scan QR with iPhone Camera |
| Appium server v3.3.0 | Working — runs on port 4723 |
| XCUITest driver v7.35.1 | Installed |
| Appium test runner (WebdriverIO) | Connects to Appium, sessions initiate |
| iOS Simulator | **BLOCKED** — requires full Xcode.app |
| Appium tests (full run) | **BLOCKED** — requires full Xcode.app |

### Root Cause

The XCUITest driver requires `xcrun --sdk iphonesimulator` to detect the iOS SDK version. This command only works when full Xcode.app is installed. With Command Line Tools only, it fails with:

```
xcrun: error: SDK "iphonesimulator" cannot be located
```

### Fix

1. Install **Xcode.app** from the Mac App Store (~15 GB)
2. Run:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -license accept
   ```
3. Build the app: `cd ios-app && npx expo run:ios`
4. Run the tests: `cd appium-tests && npm test`

---

## Test Coverage

| Suite | Tests |
|---|---|
| App Launch | Screen visible, toolbar visible, no selection count |
| Records List | List displayed, Select All button, at least one row |
| Record Selection | Select / deselect single, multi-select, select all |
| Bulk Edit Panel | Panel open, title, fields visible, typing, cancel |
| Apply Bulk Update | Apply with values, success alert, list reloads |
| Refresh | Refresh button reloads list |
| Validation | Alert shown when Apply tapped with no values |
