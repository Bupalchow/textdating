import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushToken {
  data: string;
  type: 'expo' | 'ios' | 'android';
}

class PushNotificationService {
  private pushToken: string | null = null;

  // Register for push notifications
  async registerForPushNotifications(): Promise<string | null> {
    let token: string | null = null;

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      try {
        const pushTokenData = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        token = pushTokenData.data;
        this.pushToken = token;

        // Store token locally
        await AsyncStorage.setItem('expo_push_token', token);

        // Send token to backend
        await this.sendTokenToBackend(token);
        
        console.log('Push token registered:', token);
      } catch (error) {
        console.error('Error getting push token:', error);
      }
    } else {
      console.log('Must use physical device for push notifications');
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }

  // Send push token to backend
  async sendTokenToBackend(token: string): Promise<void> {
    try {
      await api.post('/api/push-tokens/', {
        token,
        platform: Platform.OS,
        device_type: 'expo',
      });
      console.log('Push token sent to backend successfully');
    } catch (error: any) {
      console.error('Failed to send push token to backend:', error.response?.data || error.message);
    }
  }

  // Remove push token from backend
  async removeTokenFromBackend(): Promise<void> {
    if (!this.pushToken) return;

    try {
      await api.delete(`/api/push-tokens/${this.pushToken}/`);
      console.log('Push token removed from backend');
    } catch (error: any) {
      console.error('Failed to remove push token from backend:', error.response?.data || error.message);
    }
  }

  // Setup notification listeners
  setupNotificationListeners() {
    // Handle notification received while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      // You can customize behavior here
    });

    // Handle user tapping on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      
      const notification = response.notification;
      const data = notification.request.content.data;

      // Handle navigation based on notification data
      this.handleNotificationNavigation(data);
    });

    return {
      notificationListener,
      responseListener,
    };
  }

  // Handle navigation when user taps notification
  private handleNotificationNavigation(data: any) {
    // This will be handled by your navigation logic
    console.log('Navigate based on notification data:', data);
    
    // You can implement deep linking here
    // For example, navigate to chat, matches, etc.
  }

  // Clean up notification listeners
  removeNotificationListeners(listeners: any) {
    Notifications.removeNotificationSubscription(listeners.notificationListener);
    Notifications.removeNotificationSubscription(listeners.responseListener);
  }

  // Get current push token
  getPushToken(): string | null {
    return this.pushToken;
  }

  // Schedule a local notification (for testing)
  async scheduleLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        repeats: false,
      },
    });
  }
}

export default new PushNotificationService();
