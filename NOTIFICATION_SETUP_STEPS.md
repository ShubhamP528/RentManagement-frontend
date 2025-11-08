# Notification Setup Steps

## Prerequisites

✅ Packages installed: @notifee/react-native, @react-native-firebase/messaging
✅ Gradle configuration updated with Firebase dependencies
✅ Notifee maven repository added to android/build.gradle

## Step-by-Step Rebuild Process

### 1. Stop Metro Bundler

Press `Ctrl+C` in the terminal running Metro

### 2. Clean Everything

```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Clear Metro cache
npx react-native start --reset-cache
```

### 3. Rebuild the App (in a new terminal)

```bash
npx react-native run-android
```

### 4. Wait for Build to Complete

This may take 5-10 minutes. Watch for:

- ✅ "BUILD SUCCESSFUL"
- ✅ App installs on device/emulator
- ✅ No red error screens

### 5. After Successful Build

Let me know and I'll uncomment the notification code in:

- `App.tsx`
- `index.js`

## Verification Test

After uncommenting, the app should:

1. Request notification permissions on first launch
2. Create notification channels
3. Handle Firebase Cloud Messaging
4. Display notifications via Notifee

## Common Issues

### Issue: "Notifee libs not found"

**Solution:** Already fixed - maven repository added ✅

### Issue: Build fails with Gradle error

**Solution:** Run `cd android && ./gradlew clean && cd ..` and try again

### Issue: Metro cache issues

**Solution:** Run `npx react-native start --reset-cache`

### Issue: App crashes on launch after rebuild

**Solution:** Check logcat for specific error:

```bash
npx react-native log-android
```

## Next Steps

1. Run the rebuild commands above
2. Report back if successful or share any errors
3. I'll uncomment the notification code
4. Test notifications!
