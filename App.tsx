import React, {useEffect} from 'react';
import './global.css';
import HomeStackNavigator from './src/stacks/Home';
import {Provider} from 'react-redux';
import {store} from './src/redux/store';
import {ThemeProvider} from './src/contexts/ThemeContext';
import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';
import {navigationRef} from './src/navigationRef';
import notifee, {EventType} from '@notifee/react-native';
import {createNotificationChannel} from './src/utils/notificationSetup';
import {NavigationContainer} from '@react-navigation/native';

// Display notification helper - extracts data from data-only payload
async function displayNotification(remoteMessage: any) {
  // For data-only messages, everything is in 'data' field
  const {title, body, channelId, ...otherData} = remoteMessage.data || {};

  await notifee.displayNotification({
    title: title || 'New Notification',
    body: body || 'You have a new message',
    data: otherData, // Pass custom data for navigation
    android: {
      channelId: channelId || 'default',
      smallIcon: 'ic_notification',
      pressAction: {
        id: 'default',
      },
      importance: 4,
    },
    ios: {
      sound: 'default',
    },
  });
}

// Handle notification press navigation
function handleNotificationPress(notification: any) {
  console.log('Handling notification press:', notification);

  const data = notification?.data || {};
  const {screen, propertyId, roomId, tenantId} = data;

  setTimeout(() => {
    if (navigationRef.isReady()) {
      if (screen === 'PropertyDetail' && propertyId) {
        navigationRef.navigate('PropertyDetail', {propertyId});
      } else if (screen === 'RoomDetail' && roomId) {
        navigationRef.navigate('RoomDetail', {roomId});
      } else if (screen === 'TenantDocuments' && tenantId) {
        navigationRef.navigate('TenantDocuments', {tenantId});
      } else if (screen === 'TransactionDetails' && tenantId && roomId) {
        navigationRef.navigate('TransactionDetails', {
          tenantId,
          roomId,
          previousReading: 0,
        });
      }
    }
  }, 500);
}

const App: React.FC = () => {
  useEffect(() => {
    initializeNotifications();
    setupNotificationHandlers();
  }, []);

  async function initializeNotifications() {
    await createNotificationChannel();
    await requestUserPermission();
  }

  async function requestUserPermission() {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      }
    } else if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      }
    }
  }

  function setupNotificationHandlers() {
    // Foreground message handler - for data-only messages
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification received:', remoteMessage);
      await displayNotification(remoteMessage);
    });

    // Foreground notification events
    const unsubscribeForegroundEvent = notifee.onForegroundEvent(
      async ({type, detail}) => {
        console.log('Foreground event:', type);

        if (type === EventType.PRESS) {
          handleNotificationPress(detail.notification);
        }
      },
    );

    // Background notification opened app
    const unsubscribeBackgroundOpened = messaging().onNotificationOpenedApp(
      async remoteMessage => {
        console.log('Notification opened app from background');
        // For data-only messages, data is in remoteMessage.data
        handleNotificationPress({data: remoteMessage.data});
      },
    );

    // App opened from quit state
    messaging()
      .getInitialNotification()
      .then(async remoteMessage => {
        if (remoteMessage) {
          console.log('Notification opened app from quit state');
          handleNotificationPress({data: remoteMessage.data});
        }
      });

    return () => {
      unsubscribeForeground();
      unsubscribeForegroundEvent();
      unsubscribeBackgroundOpened();
    };
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <HomeStackNavigator />
      </ThemeProvider>
    </Provider>
  );
};

export default App;
