import DeviceInfo from 'react-native-device-info';
import {Alert, Linking, Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';

export const NODE_API_ENDPOINT =
  process.env.NODE_ENV === 'production'
    ? 'https://rent-management-backend-three.vercel.app'
    : 'http://192.168.1.3:8800';

const API_ENDPOINT =
  'https://rent-management-backend-three.vercel.app/app-version'; // Replace with your actual API

export const checkAppVersion = async () => {
  try {
    const currentVersion = DeviceInfo.getVersion(); // e.g. "1.0.0"
    const response = await fetch(API_ENDPOINT);

    if (!response.ok) {
      console.error('Failed to fetch app version');
      return;
    }

    const {latestVersion, mandatory, apkUrl} = await response.json();
    // const {latestVersion, mandatory, apkUrl} = {
    //   latestVersion: '1.0.1', // Example version
    //   mandatory: false, // Example mandatory flag
    //   apkUrl: 'https://rent-management-backend-three.vercel.app/download-apk', // Example APK URL
    // };

    if (currentVersion !== latestVersion) {
      Alert.alert(
        'Update Available',
        `A new version (${latestVersion}) is available.`,
        [
          {
            text: 'Update Now',
            onPress: () => {
              // If APK URL is provided, download it directly
              if (apkUrl) {
                // For Android: Open the APK download link
                if (Platform.OS === 'android') {
                  Linking.openURL(apkUrl).catch(err =>
                    console.error('Failed to open URL:', err),
                  );
                } else {
                  // If it's iOS, fallback to App Store
                  const storeUrl =
                    Platform.OS === 'ios'
                      ? 'https://apps.apple.com/app/idYOUR_APP_ID'
                      : 'https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME';
                  Linking.openURL(storeUrl);
                }
              }
            },
          },
          ...(mandatory
            ? []
            : [
                {
                  text: 'Later',
                  style: 'cancel',
                },
              ]),
        ],
        {cancelable: !mandatory},
      );
    }
  } catch (error) {
    console.error('Version check error:', error);
  }
};

export const getFCMToken = async () => {
  const token = await messaging().getToken();
  console.log('FCM Token:', token);
  // Send this token to your backend
  return token;
};

export const getDeviceInfoString = async () => {
  const deviceName = await DeviceInfo.getDeviceName();
  const uniqueId = await DeviceInfo.getUniqueId();

  const deviceInfoString = `Platform: ${
    Platform.OS
  }, Model: ${DeviceInfo.getModel()}, Brand: ${DeviceInfo.getBrand()}, System: ${DeviceInfo.getSystemVersion()}, Device ID: ${DeviceInfo.getDeviceId()}, Name: ${deviceName}, Unique ID: ${uniqueId}, App Version: ${DeviceInfo.getVersion()}`;

  console.log(deviceInfoString);
  return deviceInfoString;
};
