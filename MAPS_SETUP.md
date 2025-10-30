# Maps Setup Guide

The maps feature is currently **disabled** to prevent crashes. Follow these steps to enable it properly.

## Issue

`react-native-maps` requires proper configuration and permissions. Without this, the app will crash when trying to render maps.

## Setup Instructions

### 1. Check if react-native-maps is installed

```bash
npm list react-native-maps
```

If not installed:
```bash
npm install react-native-maps
```

### 2. iOS Configuration

#### a. Update Info.plist

Add location permissions to `ios/DropMate/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs access to your location to show delivery routes</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>This app needs access to your location to track deliveries</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs access to your location to track deliveries</string>
```

#### b. Install Pods

```bash
cd ios
pod install
cd ..
```

### 3. Android Configuration

#### a. Update AndroidManifest.xml

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

  <application>
    <!-- Add Google Maps API Key -->
    <meta-data
      android:name="com.google.android.geo.API_KEY"
      android:value="YOUR_GOOGLE_MAPS_API_KEY_HERE"/>
  </application>
</manifest>
```

#### b. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Maps SDK for Android"
4. Create credentials → API Key
5. Copy the API key and paste it in AndroidManifest.xml

### 4. Expo Configuration (if using Expo)

Update `app.json`:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      },
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ]
    },
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "This app needs access to your location to show delivery routes",
        "NSLocationAlwaysUsageDescription": "This app needs access to your location to track deliveries"
      }
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow DropMate to use your location to track deliveries."
        }
      ]
    ]
  }
}
```

### 5. Install Required Dependencies

```bash
npm install expo-location
npx expo install expo-location
```

### 6. Enable Maps Feature

Once everything is configured, enable maps in the code:

Edit `src/constants/featureFlags.ts`:

```typescript
export const FEATURE_FLAGS = {
  mapsEnabled: true, // Enable after configuration
};
```

### 7. Rebuild the App

#### For Expo:
```bash
npx expo prebuild --clean
npx expo run:ios
# or
npx expo run:android
```

#### For React Native CLI:
```bash
# iOS
cd ios
pod install
cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

### 8. Test Maps

1. Clear cache: `npx expo start -c`
2. Open the app
3. Navigate to the Map tab
4. Navigate to a Shipment Details page

Maps should now load without crashing!

## Troubleshooting

### App still crashes?

1. **Check logs:**
   ```bash
   npx expo start
   # Press 'i' for iOS or 'a' for Android
   # Check terminal for error messages
   ```

2. **Verify permissions:** Make sure location permissions are granted in device settings

3. **Check API key:** Ensure Google Maps API key is valid and has correct restrictions

4. **Clear cache:**
   ```bash
   rm -rf .expo node_modules/.cache
   npm start -- --reset-cache
   ```

### Maps show but are blank?

- Check your Google Maps API key
- Ensure billing is enabled in Google Cloud Console
- Check API key restrictions

### Need help?

Check the official documentation:
- [react-native-maps](https://github.com/react-native-maps/react-native-maps)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [Google Maps Platform](https://developers.google.com/maps/documentation)

## Alternative: Keep Maps Disabled

If you don't need maps functionality right now, leave `mapsEnabled: false` in featureFlags.ts.
The app will show placeholder cards instead of maps and won't crash.
