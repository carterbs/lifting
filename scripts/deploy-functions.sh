#!/bin/bash
set -e

echo "=== Deploying Cloud Functions ==="

# Navigate to project root
cd "$(dirname "$0")/.."

echo "Building shared package..."
npm run build -w @brad-os/shared

echo "Bundling shared package into functions..."
# Create shared directory in functions
rm -rf packages/functions/shared
mkdir -p packages/functions/shared

# Copy compiled shared package
cp -r packages/shared/dist packages/functions/shared/
cp packages/shared/package.json packages/functions/shared/

# Backup original package.json
cp packages/functions/package.json packages/functions/package.json.bak

# Update functions package.json to use local shared package
sed -i.tmp 's/"@brad-os\/shared": "\*"/"@brad-os\/shared": "file:\.\/shared"/' packages/functions/package.json
rm -f packages/functions/package.json.tmp

echo "Building functions..."
npm run build -w @brad-os/functions

echo "Deploying to Firebase..."
firebase deploy --only functions

# Restore original package.json
mv packages/functions/package.json.bak packages/functions/package.json

# Clean up bundled shared package
rm -rf packages/functions/shared

echo "=== Deployment complete! ==="
echo ""
echo "DEV Functions deployed:"
echo "  - devHealth, devExercises, devPlans, devMesocycles"
echo "  - devWorkouts, devWorkoutSets, devStretchSessions"
echo "  - devMeditationSessions, devCalendar"
echo ""
echo "PROD Functions deployed:"
echo "  - prodHealth, prodExercises, prodPlans, prodMesocycles"
echo "  - prodWorkouts, prodWorkoutSets, prodStretchSessions"
echo "  - prodMeditationSessions, prodCalendar"
echo ""
echo "Hosting URLs:"
echo "  DEV:  https://brad-os.web.app/api/dev/<endpoint>"
echo "  PROD: https://brad-os.web.app/api/prod/<endpoint>"
