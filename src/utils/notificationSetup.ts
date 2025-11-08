import notifee, { AndroidImportance } from '@notifee/react-native';

export async function createNotificationChannel() {
    await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        sound: 'default',
    });

    await notifee.createChannel({
        id: 'rent_reminders',
        name: 'Rent Reminders',
        importance: AndroidImportance.HIGH,
        sound: 'default',
    });

    await notifee.createChannel({
        id: 'payments',
        name: 'Payment Notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
    });

    await notifee.createChannel({
        id: 'documents',
        name: 'Document Updates',
        importance: AndroidImportance.DEFAULT,
        sound: 'default',
    });
}
