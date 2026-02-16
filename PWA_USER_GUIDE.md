# Planning Poker PWA - User Guide

## Installing the App

### Desktop (Chrome, Edge, Brave)
1. Visit the website
2. Look for the install icon (⊕) in the address bar
3. Click it and select "Install"
4. The app will open in its own window

### Android
1. Visit the website in Chrome
2. Tap the menu (⋮)
3. Select "Add to Home screen" or "Install app"
4. Tap "Install" on the prompt
5. The app will appear on your home screen

### iOS (iPhone/iPad)
1. Visit the website in Safari
2. Tap the Share button (□↑)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. The app will appear on your home screen

## Benefits of Installing

- ✅ Quick access from home screen/app launcher
- ✅ Opens in standalone window (no browser UI)
- ✅ Offline support for basic functionality
- ✅ Faster loading with smart caching
- ✅ Automatic updates when available

## Using the App

### Online Mode
- Full functionality
- Real-time synchronization with other users
- Instant updates

### Offline Mode
- View previously loaded rooms
- Basic UI available
- Data syncs when connection restored

### Updates
When a new version is available:
1. A blue banner appears at the bottom
2. Click "Update Now" to install immediately
3. Or click "Later" to update when convenient
4. The app checks for updates automatically

## Uninstalling the App

### Desktop - Chrome/Edge
1. Open the installed app
2. Click the three dots menu (⋮) in the top-right
3. Select "Uninstall [App Name]"
4. Confirm

**Alternative:**
- Go to `chrome://apps/`
- Right-click the app icon
- Select "Remove from Chrome"

### Desktop - Windows
1. Settings → Apps → Apps & features
2. Find "Planning Poker"
3. Click Uninstall

### Desktop - macOS
1. Open Applications folder
2. Find "Planning Poker"
3. Drag to Trash

### Android
1. Long-press the app icon on home screen
2. Select "Uninstall" or drag to "Uninstall"
3. Confirm

**Alternative:**
- Settings → Apps → See all apps
- Find "Planning Poker"
- Tap Uninstall

### iOS
1. Long-press the app icon
2. Tap "Remove App"
3. Tap "Delete App"
4. Confirm

## Troubleshooting

### iOS-Specific Issues

#### Status bar overlap (iPhone)
If you installed the PWA before version 1.3.0-rc.4 and see the app header overlapping with the iPhone status bar:
1. Delete the PWA from your home screen
2. Clear Safari cache: Settings → Safari → Clear History and Website Data
3. Visit the app URL again in Safari
4. Reinstall using "Add to Home Screen"

**Note:** Meta tag changes (like status bar style) only take effect after deleting and reinstalling the PWA.

#### Status bar not visible in landscape
This was fixed in version 1.3.0-rc.4. If you still experience this:
1. Check the version indicator on the home page (should show v1.3.0-rc.4 or later)
2. If outdated, delete and reinstall the PWA
3. The status bar should now be visible in both portrait and landscape modes

### App won't install
- Ensure you're using a supported browser (Chrome, Edge, Safari)
- Check that you have enough storage space
- Try clearing browser cache and reload

### Updates not appearing
- Updates are checked automatically every hour
- Manual check: Close and reopen the app
- Or wait for the next automatic check

### Offline mode issues
- Some features require internet connection
- Check your network connection
- Try refreshing when back online

### Clear app data (reset)
If you experience issues:

**Chrome/Edge:**
1. Right-click the app icon
2. Select "App info"
3. Click "Clear data"

**Android:**
1. Settings → Apps → Planning Poker
2. Storage → Clear storage

**iOS:**
1. Uninstall and reinstall the app

## Privacy & Storage

### What is stored locally?
- Your username (in browser storage)
- Recently accessed room IDs
- App files for offline use

### What is NOT stored locally?
- Other users' votes or data
- Room history
- Sensitive information

### How to clear stored data?
See "Clear app data" section above.

## Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/ammarnajjar/planning-poker/issues)
- Report a bug with details about your device and browser

## Technical Details

- **Technology:** Progressive Web App (PWA)
- **Caching:** Smart caching for optimal performance
- **Updates:** Automatic with user notification
- **Offline:** Basic functionality available
- **Storage:** Minimal local storage for performance

---

**Note:** This is a Progressive Web App (PWA), not a native app. It's installed through your browser and can be uninstalled like any other app. No app store required!
