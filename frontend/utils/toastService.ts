import { Alert } from 'react-native';

interface ToastOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

class ToastService {
  static show({ title, message, type = 'info' }: ToastOptions) {
    // For web and basic implementation, we'll use Alert
    // In a production app, you might want to use a proper toast library
    
    const alertTitle = title || (type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info');
    
    // Add some visual distinction
    const icon = type === 'error' ? '❌ ' : type === 'success' ? '✅ ' : 'ℹ️ ';
    
    Alert.alert(alertTitle, `${icon}${message}`);
  }

  static error(message: string, title?: string) {
    this.show({ title, message, type: 'error' });
  }

  static success(message: string, title?: string) {
    this.show({ title, message, type: 'success' });
  }

  static info(message: string, title?: string) {
    this.show({ title, message, type: 'info' });
  }
}

export default ToastService;
