import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

interface MatchModalProps {
  visible: boolean;
  onClose: () => void;
  onStartChat: () => void;
  chatRoomId?: number;
}

const { width } = Dimensions.get('window');

export default function MatchModal({ visible, onClose, onStartChat, chatRoomId }: MatchModalProps) {
  const scaleValue = React.useRef(new Animated.Value(0)).current;
  const opacityValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleValue, opacityValue]);

  const handleStartChat = () => {
    onStartChat();
    onClose();
  };

  const handleKeepSwiping = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: opacityValue }
        ]}
      >
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          {/* Celebration Animation */}
          <View style={styles.celebrationContainer}>
            <Text style={styles.celebrationIcon}>🎉</Text>
            <Text style={styles.celebrationIcon}>💕</Text>
            <Text style={styles.celebrationIcon}>✨</Text>
          </View>

          <Text style={styles.title}>It&apos;s a Match!</Text>
          <Text style={styles.subtitle}>
            You both liked each other&apos;s cards!
          </Text>

          {chatRoomId && (
            <Text style={styles.chatInfo}>
              Chat Room #{chatRoomId} created
            </Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.keepSwipingButton}
              onPress={handleKeepSwiping}
            >
              <Text style={styles.keepSwipingText}>Keep Swiping</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.startChatButton}
              onPress={handleStartChat}
            >
              <Text style={styles.startChatText}>Start Chatting</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: width * 0.85,
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  celebrationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  celebrationIcon: {
    fontSize: 40,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  chatInfo: {
    fontSize: 14,
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  keepSwipingButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  keepSwipingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  startChatButton: {
    flex: 1,
    backgroundColor: '#e91e63',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  startChatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
