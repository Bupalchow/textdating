import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../../utils/api';

interface Response {
  id: number;
  response_text: string;
  created_at: string;
  responder_username: string;
}

interface CardResponsesModalProps {
  visible: boolean;
  cardId: number | null;
  cardContent: string;
  onClose: () => void;
  onResponseAccepted: () => void;
}

export default function CardResponsesModal({
  visible,
  cardId,
  cardContent,
  onClose,
  onResponseAccepted,
}: CardResponsesModalProps) {
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingResponseId, setProcessingResponseId] = useState<number | null>(null);

  useEffect(() => {
    const fetchResponses = async () => {
      if (!cardId) return;

      setIsLoading(true);
      try {
        console.log(`Fetching responses for card ${cardId}`);
        const response = await api.get(`/api/textcards/${cardId}/responses/`);
        console.log('Card responses:', response.data);
        setResponses(response.data.results || response.data || []);
      } catch (error: any) {
        console.error('Fetch responses error:', error.response?.data || error.message);
        Alert.alert('Error', 'Failed to load responses. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (visible && cardId) {
      fetchResponses();
    }
  }, [visible, cardId]);

  const handleAcceptResponse = async (responseId: number) => {
    setProcessingResponseId(responseId);
    try {
      console.log(`Accepting response ${responseId} for card ${cardId}`);
      const response = await api.post(`/api/responses/${responseId}/accept/`);
      console.log('Accept response result:', response.data);
      
      Alert.alert(
        'Match Created!',
        `You've matched! Chat room created.`,
        [
          {
            text: 'Go to Matches',
            onPress: () => {
              onResponseAccepted();
              onClose();
            },
          },
          {
            text: 'Stay Here',
            onPress: () => {
              // Remove the accepted response from the list
              setResponses(prev => prev.filter(r => r.id !== responseId));
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Accept response error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to accept response. Please try again.');
    } finally {
      setProcessingResponseId(null);
    }
  };

  const handleIgnoreResponse = async (responseId: number) => {
    setProcessingResponseId(responseId);
    try {
      console.log(`Ignoring response ${responseId}`);
      await api.post(`/api/responses/${responseId}/ignore/`);
      
      // Remove the ignored response from the list
      setResponses(prev => prev.filter(r => r.id !== responseId));
      
      Alert.alert('Response Ignored', 'The response has been ignored.');
    } catch (error: any) {
      console.error('Ignore response error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to ignore response. Please try again.');
    } finally {
      setProcessingResponseId(null);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return 'Just now';
    }
  };

  const renderResponse = ({ item }: { item: Response }) => (
    <View style={styles.responseCard}>
      <View style={styles.responseHeader}>
        <Text style={styles.responderName}>{item.responder_username}</Text>
        <Text style={styles.responseTime}>{formatTimestamp(item.created_at)}</Text>
      </View>
      
      <Text style={styles.responseText}>{item.response_text}</Text>
      
      <View style={styles.responseActions}>
        <TouchableOpacity
          style={[
            styles.acceptButton,
            processingResponseId === item.id && styles.disabledButton,
          ]}
          onPress={() => handleAcceptResponse(item.id)}
          disabled={processingResponseId === item.id}
        >
          {processingResponseId === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.acceptButtonText}>✓ Accept & Match</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.ignoreButton,
            processingResponseId === item.id && styles.disabledButton,
          ]}
          onPress={() => handleIgnoreResponse(item.id)}
          disabled={processingResponseId === item.id}
        >
          <Text style={styles.ignoreButtonText}>✗ Ignore</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Responses to Your Card</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardPreview}>
            <Text style={styles.cardPreviewLabel}>Your Card:</Text>
            <Text style={styles.cardPreviewText}>{cardContent}</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading responses...</Text>
            </View>
          ) : responses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No responses yet</Text>
              <Text style={styles.emptySubtext}>
                When someone responds to your card, you&apos;ll see it here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={responses}
              renderItem={renderResponse}
              keyExtractor={(item) => item.id.toString()}
              style={styles.responsesList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  cardPreview: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  cardPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  cardPreviewText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  responsesList: {
    flex: 1,
  },
  responseCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  responderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  responseTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  responseText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  responseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  ignoreButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  ignoreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
