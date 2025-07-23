import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNotifications } from '../../contexts/NotificationContext';
import pushNotificationService from '../../utils/pushNotificationService';

export default function NotificationTestPanel() {
  const { refreshNotifications } = useNotifications();

  const testLocalNotification = async () => {
    await pushNotificationService.scheduleLocalNotification(
      'Test Notification',
      'This is a test notification to verify the system works!',
      { test: true }
    );
    Alert.alert('Success', 'Local notification scheduled!');
  };

  const testTokenRegistration = async () => {
    const token = await pushNotificationService.registerForPushNotifications();
    if (token) {
      Alert.alert('Success', `Push token registered: ${token.substring(0, 20)}...`);
    } else {
      Alert.alert('Error', 'Failed to register push token');
    }
  };

  const refreshNotifs = () => {
    refreshNotifications();
    Alert.alert('Success', 'Notifications refreshed!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Notification Test Panel</Text>
      
      <TouchableOpacity style={styles.button} onPress={testLocalNotification}>
        <Text style={styles.buttonText}>Send Test Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testTokenRegistration}>
        <Text style={styles.buttonText}>Test Push Token Registration</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={refreshNotifs}>
        <Text style={styles.buttonText}>Refresh Notifications</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Note: This panel is for testing only. Remove from production.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#495057',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
