import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import ResponseModal from '../components/ResponseModal';
import BottomNav from '../components/BottomNav';
import MatchModal from '../components/MatchModal';
import NotificationTestPanel from '../components/NotificationTestPanel';

interface FeedCard {
  card_id: number;
  content: string;
  created_by: string;
  timestamp: string;
}

export default function FeedScreen() {
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRouterReady, setIsRouterReady] = useState(false);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<FeedCard | null>(null);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchChatRoomId, setMatchChatRoomId] = useState<number | undefined>(undefined);
  const { isAuthenticated, logout } = useAuth();

  // Set router as ready after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRouterReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Check authentication after router is ready
  useFocusEffect(
    React.useCallback(() => {
      if (isRouterReady && !isAuthenticated) {
        console.log('Feed: Not authenticated, redirecting to login');
        router.replace('/pages/login');
      }
    }, [isAuthenticated, isRouterReady])
  );

  const fetchCards = React.useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      console.log('Fetching cards from /api/textcards/feed/ (original endpoint)');
      const response = await api.get('/api/textcards/feed/');
      console.log('Feed response:', response.data);
      console.log('First card structure:', response.data.results?.[0]);
      
      // Validate the data structure
      const validCards = (response.data.results || []).filter((card: any) => {
        if (!card || typeof card.card_id === 'undefined') {
          console.warn('Invalid card found:', card);
          return false;
        }
        return true;
      });
      
      console.log(`Setting ${validCards.length} valid cards out of ${response.data.results?.length || 0} total`);
      setCards(validCards);
    } catch (error: any) {
      console.error('Fetch cards error:', error.response?.data || error.message);
      
      let errorMessage = 'Failed to load cards. Please try again.';
      if (error.response?.status === 401) {
        console.log('401 error - checking token...');
        const token = await import('@react-native-async-storage/async-storage').then(module => 
          module.default.getItem('access_token')
        );
        console.log('Current token exists:', !!token);
        
        // Token expired or invalid
        Alert.alert(
          'Session Expired',
          'Please log in again.',
          [{ text: 'OK', onPress: () => logout() }]
        );
        return;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [logout]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCards();
    }
  }, [isAuthenticated, fetchCards]);

  const handleReject = async (cardId: number) => {
    try {
      console.log('Rejecting card:', cardId);
      
      // Call Module 4 reject API
      const response = await api.post('/api/cards/react/reject/', {
        card_id: cardId  // Frontend uses 'id', API expects 'card_id'
      });
      
      console.log('Reject response:', response.data);
      
      // Remove card from local state
      setCards(prev => prev.filter(card => card.card_id !== cardId));
      
    } catch (error: any) {
      console.error('Reject card error:', error.response?.data || error.message);
      
      let errorMessage = 'Failed to reject card. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleRespond = (card: FeedCard) => {
    setSelectedCard(card);
    setResponseModalVisible(true);
  };

  const handleSubmitResponse = async (responseText: string) => {
    if (!selectedCard) return;

    try {
      console.log('Submitting response for card:', selectedCard.card_id);
      console.log('Response text:', responseText);
      
      // Call Module 4 respond API
      const response = await api.post('/api/cards/react/respond/', {
        card_id: selectedCard.card_id,  // Frontend uses 'card_id', API expects 'card_id'
        response_text: responseText
      });
      
      console.log('Response API result:', response.data);
      
      // Remove card from local state
      setCards(prev => prev.filter(card => card.card_id !== selectedCard.card_id));
      
      // Show success message (no auto-match, creator needs to accept)
      Alert.alert(
        'Response Sent!', 
        'Your response has been sent to the card creator. You\'ll be notified if they accept it!',
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.error('Submit response error:', error.response?.data || error.message);
      
      let errorMessage = 'Failed to send response. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Error', errorMessage);
      throw error; // Re-throw so modal can handle it
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

  const renderCard = ({ item }: { item: FeedCard }) => {
    // Defensive programming - ensure we have required data
    if (!item || typeof item.card_id === 'undefined' || !item.content) {
      console.warn('Invalid card data:', item);
      return null;
    }

    return (
      <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.anonymousName}>{item.created_by}</Text>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
      </View>
      
      <Text style={styles.cardContent}>{item.content}</Text>
      
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.respondButton}
          onPress={() => handleRespond(item)}
        >
          <Text style={styles.respondButtonText}>💭 Respond</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleReject(item.card_id)}
        >
          <Text style={styles.rejectButtonText}>❌ Pass</Text>
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No cards available</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to create a card and start conversations!
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          if (isRouterReady) {
            router.replace('/pages/create-card' as any);
          }
        }}
      >
        <Text style={styles.createButtonText}>Create a Card</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Text Cards</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              if (isRouterReady) {
                router.replace('/pages/create-card' as any);
              }
            }}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={cards}
          renderItem={renderCard}
          keyExtractor={(item) => (item.card_id || Math.random()).toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchCards(true)}
              colors={['#3b82f6']}
            />
          }
          ListEmptyComponent={renderEmpty}
          ListHeaderComponent={<NotificationTestPanel />}
          showsVerticalScrollIndicator={false}
        />

        <ResponseModal
          visible={responseModalVisible}
          cardText={selectedCard?.content || ''}
          onClose={() => {
            setResponseModalVisible(false);
            setSelectedCard(null);
          }}
          onSubmit={handleSubmitResponse}
        />

        <MatchModal
          visible={matchModalVisible}
          chatRoomId={matchChatRoomId}
          onClose={() => {
            setMatchModalVisible(false);
            setMatchChatRoomId(undefined);
          }}
          onStartChat={() => {
            // Navigate to chat screen when implemented
            router.replace('/pages/matches' as any);
          }}
        />
      </SafeAreaView>
      
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  anonymousName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  cardContent: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 22,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  respondButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.45,
  },
  respondButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  likeButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.45,
  },
  likeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.45,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
