#!/bin/bash

echo "🚀 Building Optimized Release APK..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Clean
echo -e "${BLUE}Step 1: Cleaning previous builds...${NC}"
cd android
./gradlew clean
cd ..
echo -e "${GREEN}✓ Clean complete${NC}"
echo ""

# Step 2: Build Release APK
echo -e "${BLUE}Step 2: Building release APK with optimizations...${NC}"
echo -e "${YELLOW}This may take 5-10 minutes...${NC}"
cd android
./gradlew assembleRelease
cd ..
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 3: Show APK locations
echo -e "${BLUE}Step 3: APK Files Generated:${NC}"
echo ""
echo "📦 APK Locations:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Find all APKs
find android/app/build/outputs/apk/release -name "*.apk" -exec ls -lh {} \; | while read -r line; do
    size=$(echo $line | awk '{print $5}')
    file=$(echo $line | awk '{print $9}')
    filename=$(basename $file)
    echo -e "${GREEN}✓${NC} $filename ${YELLOW}($size)${NC}"
    echo "   $file"
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}🎉 Build Successful!${NC}"
echo ""
echo "Optimizations Applied:"
echo "  ✓ ProGuard enabled (code minification)"
echo "  ✓ Resource shrinking enabled"
echo "  ✓ APK splits by architecture"
echo "  ✓ Axios integration included"
echo ""
echo "To install on device:"
echo "  adb install android/app/build/outputs/apk/release/app-universal-release.apk"
echo ""
echo "Or for specific architecture:"
echo "  adb install android/app/build/outputs/apk/release/app-arm64-v8a-release.apk"
