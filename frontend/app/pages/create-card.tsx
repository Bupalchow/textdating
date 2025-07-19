import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

export default function CreateCardScreen() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRouterReady, setIsRouterReady] = useState(false);
  const { isAuthenticated } = useAuth();

  // Set router as ready after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRouterReady(true);
    }, 100); // Small delay to ensure router is initialized

    return () => clearTimeout(timer);
  }, []);

  // Check authentication after router is ready
  useFocusEffect(
    React.useCallback(() => {
      if (isRouterReady && !isAuthenticated) {
        console.log('CreateCard: Not authenticated, redirecting to login');
        router.replace('/pages/login');
      }
    }, [isAuthenticated, isRouterReady])
  );

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something before submitting');
      return;
    }

    if (content.length > 280) {
      Alert.alert('Error', 'Message is too long. Maximum 280 characters allowed.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/textcards/create/', {
        content: content.trim(),
      });

      console.log('Card created:', response.data);
      
      Alert.alert(
        'Success!',
        'Your card has been created and shared anonymously.',
        [
          {
            text: 'View Feed',
            onPress: () => {
              // Small delay to ensure navigation works properly
              setTimeout(() => {
                router.replace('/pages/feed');
              }, 100);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Create card error:', error.response?.data || error.message);
      console.log('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to create card. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Add a small delay to ensure loading state is properly updated
      setTimeout(() => {
        Alert.alert('Error', errorMessage);
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const remainingChars = 280 - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Share Your Thoughts</Text>
            <Text style={styles.subtitle}>
              Create an anonymous text card to connect with others
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, isOverLimit && styles.textInputError]}
              value={content}
              onChangeText={setContent}
              placeholder="What's on your mind? Ask a question, share a thought, or start a conversation..."
              multiline
              maxLength={300} // Allow slight overage for better UX
              editable={!isLoading}
              textAlignVertical="top"
            />
            
            <View style={styles.charCounter}>
              <Text style={[
                styles.charCountText,
                isOverLimit && styles.charCountError
              ]}>
                {remainingChars} characters remaining
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (isLoading || !content.trim() || isOverLimit) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isLoading || !content.trim() || isOverLimit}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Share Anonymously</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace('/pages/feed')}
            disabled={isLoading}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1a1a1a',
    minHeight: 120,
    maxHeight: 200,
  },
  textInputError: {
    borderColor: '#ef4444',
  },
  charCounter: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  charCountText: {
    fontSize: 14,
    color: '#6b7280',
  },
  charCountError: {
    color: '#ef4444',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
});
