import React, { useState, useEffect } from 'react';
import 'react-native-url-polyfill/auto';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, ActivityIndicator, Image, BackHandler } from 'react-native';
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
import { useAppTheme } from './src/utils/Theme';
import { supabase } from './src/services/supabase';

const { width } = Dimensions.get('window');

function AppContent() {
  const theme = useAppTheme();
  const styles = getStyles(theme);
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

  useEffect(() => {
    const backAction = () => {
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true; // Prevent default behavior (exit app)
      }
      return false; // Let default behavior happen (exit app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [activeTab]);

  if (!user) {
    return <AuthScreen />;
  }

  if (profile && !profile.onboarding_completed) {
    return <OnboardingScreen />;
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        {/* Main Content */}
        <View style={styles.content}>
          <AnimatePresence mode="wait" {...({} as any)}>
            <MotiView
              key={activeTab}
              from={{ opacity: 0, translateX: 50, scale: 0.98 } as any}
              animate={{ opacity: 1, translateX: 0, scale: 1 } as any}
              exit={{ opacity: 0, translateX: -50, scale: 0.98 } as any}
              transition={{ type: 'spring', damping: 20, stiffness: 200 } as any}
              style={styles.contentWrapper}
            >
              {renderContent()}
            </MotiView>
          </AnimatePresence>
        </View>
      </View>

      {/* Bottom Navigation */}
      <AnimatePresence>
        {activeTab !== 'camera' && (
          <MotiView
            from={{ translateY: 100 } as any}
            animate={{ translateY: 0 } as any}
            exit={{ translateY: 100 } as any}
            transition={{ type: 'spring', damping: 25, stiffness: 200 } as any}
            style={[styles.navBarContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}
          >
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.navBar}>
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => setActiveTab('home')}
            activeOpacity={0.7}
          >
            <Home 
              size={22} 
              color={activeTab === 'home' ? theme.colors.primary : theme.colors.secondaryText} 
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
              color={activeTab === 'chat' ? theme.colors.primary : theme.colors.secondaryText} 
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
                scale: activeTab === ('camera' as string) ? 1.1 : 1,
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
              color={activeTab === 'history' ? theme.colors.primary : theme.colors.secondaryText} 
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
              color={activeTab === 'profile' ? theme.colors.primary : theme.colors.secondaryText} 
              strokeWidth={activeTab === 'profile' ? 2.5 : 2}
            />
            <Text style={[styles.navText, activeTab === 'profile' && styles.navTextActive]}>Profile</Text>
          </TouchableOpacity>
            </View>
          </MotiView>
        )}
      </AnimatePresence>
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

const getStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  main: {
    flex: 1,
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
    borderTopColor: theme.colors.separator,
    backgroundColor: 'rgba(255,255,255,0.85)',
    overflow: 'hidden',
  },
  navBar: { 
    flexDirection: 'row', 
    height: 65, 
    alignItems: 'center', 
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.md,
  },
  navItem: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    flex: 1,
    height: '100%',
  },
  navText: { 
    fontSize: 10, 
    color: theme.colors.secondaryText, 
    marginTop: 4, 
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  navTextActive: { 
    color: theme.colors.primary,
    fontWeight: '700',
  },
  cameraButton: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    top: -15,
  },
  cameraButtonInner: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: theme.colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    ...theme.shadows.medium,
  },
});
