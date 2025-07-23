import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationsModal from './NotificationsModal';

interface BottomNavProps {
  onNavigate?: (route: string) => void;
}

export default function BottomNav({ onNavigate }: BottomNavProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNavigation = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      router.replace(route as any);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/pages/login' as any);
  };

  const isActive = (route: string) => {
    return pathname === route || pathname.includes(route);
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.nav}>
          <TouchableOpacity
            style={[styles.navItem, isActive('/pages/feed') && styles.activeNavItem]}
            onPress={() => handleNavigation('/pages/feed')}
          >
            <Text style={[styles.navIcon, isActive('/pages/feed') && styles.activeNavIcon]}>
              🏠
            </Text>
            <Text style={[styles.navLabel, isActive('/pages/feed') && styles.activeNavLabel]}>
              Feed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, isActive('/pages/my-cards') && styles.activeNavItem]}
            onPress={() => handleNavigation('/pages/my-cards')}
          >
            <Text style={[styles.navIcon, isActive('/pages/my-cards') && styles.activeNavIcon]}>
              📝
            </Text>
            <Text style={[styles.navLabel, isActive('/pages/my-cards') && styles.activeNavLabel]}>
              My Cards
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, isActive('/pages/matches') && styles.activeNavItem]}
            onPress={() => handleNavigation('/pages/matches')}
          >
            <Text style={[styles.navIcon, isActive('/pages/matches') && styles.activeNavIcon]}>
              💬
            </Text>
            <Text style={[styles.navLabel, isActive('/pages/matches') && styles.activeNavLabel]}>
              Chats
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setShowNotifications(true)}
          >
            <View style={styles.notificationContainer}>
              <Text style={styles.navIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.navLabel}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={handleLogout}
          >
            <Text style={styles.navIcon}>🚪</Text>
            <Text style={styles.navLabel}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <NotificationsModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 60,
  },
  activeNavItem: {
    backgroundColor: '#eff6ff',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeNavIcon: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeNavLabel: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  notificationContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
