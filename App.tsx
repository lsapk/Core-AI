import React, { useState, useEffect } from 'react';
import 'react-native-url-polyfill/auto';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Camera, List, Activity, User, MessageSquare } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { AnimatePresence, View as MotiView } from 'moti';
import DashboardScreen from './src/components/DashboardScreen';
import CameraScreen from './src/components/CameraScreen';
import HistoryScreen from './src/components/HistoryScreen';
import ProfileScreen from './src/components/ProfileScreen';
import ChatScreen from './src/components/ChatScreen';
import AuthScreen from './src/components/AuthScreen';
import OnboardingScreen from './src/components/OnboardingScreen';
import { useStore } from './src/store/useStore';
import { Theme } from './src/utils/Theme';
import { supabase } from './src/services/supabase';

const { width } = Dimensions.get('window');

function AppContent() {
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'camera' | 'history' | 'profile'>('home');
  const insets = useSafeAreaInsets();
  const { user, profile, setUser, isLoading } = useStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null, session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null, session);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  if (!user) {
    return <AuthScreen />;
  }

  if (profile && !profile.onboarding_completed) {
    return <OnboardingScreen />;
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <DashboardScreen onNavigate={setActiveTab} />;
      case 'chat': return <ChatScreen />;
      case 'camera': return <CameraScreen onComplete={() => setActiveTab('home')} />;
      case 'history': return <HistoryScreen />;
      case 'profile': return <ProfileScreen />;
      default: return <DashboardScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={[styles.main, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <MotiView 
            from={{ opacity: 0, translateY: -10 } as any}
            animate={{ opacity: 1, translateY: 0 } as any}
            style={styles.headerLogo}
          >
            <View style={styles.logoIcon}>
              <Activity size={18} color="white" strokeWidth={3} />
            </View>
            <Text style={styles.headerTitle}>Core AI</Text>
          </MotiView>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <AnimatePresence mode="wait" {...({} as any)}>
            <MotiView
              key={activeTab}
              from={{ opacity: 0, scale: 0.98 } as any}
              animate={{ opacity: 1, scale: 1 } as any}
              exit={{ opacity: 0, scale: 1.02 } as any}
              transition={{ type: 'timing', duration: 300 } as any}
              style={styles.contentWrapper}
            >
              {renderContent()}
            </MotiView>
          </AnimatePresence>
        </View>
      </View>

      {/* Bottom Navigation */}
      <BlurView intensity={80} tint="light" style={[styles.navBarContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => setActiveTab('home')}
            activeOpacity={0.7}
          >
            <Home 
              size={22} 
              color={activeTab === 'home' ? Theme.colors.primary : Theme.colors.secondaryText} 
              strokeWidth={activeTab === 'home' ? 2.5 : 2}
            />
            <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => setActiveTab('chat')}
            activeOpacity={0.7}
          >
            <MessageSquare 
              size={22} 
              color={activeTab === 'chat' ? Theme.colors.primary : Theme.colors.secondaryText} 
              strokeWidth={activeTab === 'chat' ? 2.5 : 2}
            />
            <Text style={[styles.navText, activeTab === 'chat' && styles.navTextActive]}>AI Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cameraButton} 
            onPress={() => setActiveTab('camera')}
            activeOpacity={0.8}
          >
            <MotiView
              animate={{
                scale: activeTab === 'camera' ? 1.1 : 1,
              }}
              style={styles.cameraButtonInner}
            >
              <Camera size={26} color="white" strokeWidth={2.5} />
            </MotiView>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => setActiveTab('history')}
            activeOpacity={0.7}
          >
            <List 
              size={22} 
              color={activeTab === 'history' ? Theme.colors.primary : Theme.colors.secondaryText} 
              strokeWidth={activeTab === 'history' ? 2.5 : 2}
            />
            <Text style={[styles.navText, activeTab === 'history' && styles.navTextActive]}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.7}
          >
            <User 
              size={22} 
              color={activeTab === 'profile' ? Theme.colors.primary : Theme.colors.secondaryText} 
              strokeWidth={activeTab === 'profile' ? 2.5 : 2}
            />
            <Text style={[styles.navText, activeTab === 'profile' && styles.navTextActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Theme.colors.background 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  main: {
    flex: 1,
  },
  header: { 
    paddingHorizontal: Theme.spacing.lg, 
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLogo: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  logoIcon: { 
    width: 32, 
    height: 32, 
    backgroundColor: Theme.colors.primary, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 10,
    ...Theme.shadows.soft,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: Theme.colors.text,
    letterSpacing: -0.5,
  },
  content: { 
    flex: 1 
  },
  contentWrapper: {
    flex: 1,
  },
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  navBar: { 
    flexDirection: 'row', 
    height: 60, 
    alignItems: 'center', 
    justifyContent: 'space-around',
    paddingHorizontal: Theme.spacing.lg,
  },
  navItem: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    flex: 1 
  },
  navText: { 
    fontSize: 11, 
    color: Theme.colors.secondaryText, 
    marginTop: 4, 
    fontWeight: '600' 
  },
  navTextActive: { 
    color: Theme.colors.primary 
  },
  cameraButton: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    top: -20,
  },
  cameraButtonInner: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: Theme.colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    ...Theme.shadows.medium,
  },
});
