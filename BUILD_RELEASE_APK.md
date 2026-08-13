# Build Compressed Release APK

## Quick Build Commands

### Option 1: Build Release APK (Recommended)

```bash
cd android
./gradlew assembleRelease
cd ..
```

**APK Location:**
`android/app/build/outputs/apk/release/app-release.apk`

### Option 2: Build with Splits (Smaller APKs per Architecture)

```bash
cd android
./gradlew assembleRelease
cd ..
```

**APK Locations:**

- `android/app/build/outputs/apk/release/app-armeabi-v7a-release.apk` (~25MB)
- `android/app/build/outputs/apk/release/app-arm64-v8a-release.apk` (~30MB)
- `android/app/build/outputs/apk/release/app-x86-release.apk` (~35MB)
- `android/app/build/outputs/apk/release/app-x86_64-release.apk` (~35MB)

## Enable APK Splits for Smaller Size

To enable architecture-specific APKs, uncomment this in `android/app/build.gradle`:

```gradle
splits {
    abi {
        enable true
        reset()
        include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
        universalApk false  // Set to true if you want a universal APK too
    }
}
```

## Additional Optimizations

### 1. Enable ProGuard (Already configured)

In `android/app/build.gradle`:

```gradle
def enableProguardInReleaseBuilds = true  // Change to true
```

### 2. Enable R8 Code Shrinking

Add to `android/gradle.properties`:

```properties
android.enableR8=true
android.enableR8.fullMode=true
```

### 3. Reduce APK Size Further

Add to `android/app/build.gradle` inside `android` block:

```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
    }
}
```

## Build Commands Explained

### Clean Build (Recommended before release)

```bash
cd android
./gradlew clean
./gradlew assembleRelease
cd ..
```

### Build with Verbose Output

```bash
cd android
./gradlew assembleRelease --info
cd ..
```

### Build Signed APK (if you have keystore)

```bash
cd android
./gradlew assembleRelease
cd ..
```

The signing is already configured in your `build.gradle` with:

- `MYAPP_UPLOAD_STORE_FILE`
- `MYAPP_UPLOAD_STORE_PASSWORD`
- `MYAPP_UPLOAD_KEY_ALIAS`
- `MYAPP_UPLOAD_KEY_PASSWORD`

## Expected APK Sizes

| Build Type                  | Size                       |
| --------------------------- | -------------------------- |
| Debug APK                   | ~60-80 MB                  |
| Release APK (no splits)     | ~40-50 MB                  |
| Release APK (with splits)   | ~25-35 MB per architecture |
| Release APK (ProGuard + R8) | ~20-30 MB per architecture |

## Verify APK

After building, verify the APK:

```bash
# Check APK size
ls -lh android/app/build/outputs/apk/release/

# Install on device
adb install android/app/build/outputs/apk/release/app-release.apk

# Or for specific architecture
adb install android/app/build/outputs/apk/release/app-arm64-v8a-release.apk
```

## Troubleshooting

### Build Fails

```bash
cd android
./gradlew clean
./gradlew assembleRelease --stacktrace
cd ..
```

### APK Not Found

Check all possible locations:

```bash
find android/app/build/outputs -name "*.apk"
```

### Signing Issues

Make sure you have the keystore file and properties set in:

- `android/gradle.properties` (or `~/.gradle/gradle.properties`)

## Current Configuration Status

✅ Release signing configured
✅ ProGuard ready (set to false, can enable)
✅ APK splits commented out (can enable)
✅ Firebase dependencies added
✅ Axios integration complete

## Recommended Build Process

1. **Clean everything:**

   ```bash
   cd android && ./gradlew clean && cd ..
   ```

2. **Build release APK:**

   ```bash
   cd android && ./gradlew assembleRelease && cd ..
   ```

3. **Find your APK:**

   ```bash
   ls -lh android/app/build/outputs/apk/release/
   ```

4. **Test the APK:**
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

## Next Steps

After building, you can:

1. Test the APK on a device
2. Upload to Google Play Console
3. Distribute via Firebase App Distribution
4. Share directly with users

The APK will include:

- ✅ Axios integration for all API calls
- ✅ Automatic authentication
- ✅ Session management
- ⚠️ Notifications (commented out - uncomment after testing)
