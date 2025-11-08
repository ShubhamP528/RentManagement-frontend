/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import notifee, {EventType} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

// Background message handler - handles data-only messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message received:', remoteMessage);

  // Extract data (since we're sending data-only)
  const {title, body, channelId, ...otherData} = remoteMessage.data || {};

  // Display with Notifee
  await notifee.displayNotification({
    title: title || 'New Notification',
    body: body || 'You have a new message',
    data: otherData, // Pass remaining data for navigation
    android: {
      channelId: channelId || 'default',
      smallIcon: 'ic_notification',
      pressAction: {
        id: 'default',
      },
    },
  });
});

// Background event handler for notification interactions
notifee.onBackgroundEvent(async ({type, detail}) => {
  console.log('Background event:', type);

  if (type === EventType.PRESS) {
    console.log('User pressed notification:', detail.notification);
  }
});

AppRegistry.registerComponent(appName, () => App);
