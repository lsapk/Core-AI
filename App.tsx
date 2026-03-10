import React, { useState, useEffect } from 'react';
import 'react-native-url-polyfill/auto';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Home, Camera, List, Activity } from 'lucide-react-native';
import DashboardScreen from './src/components/DashboardScreen';
import CameraScreen from './src/components/CameraScreen';
import HistoryScreen from './src/components/HistoryScreen';
import { useStore } from './src/store/useStore';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'camera' | 'history'>('home');
  const fetchMeals = useStore(state => state.fetchMeals);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <View style={styles.logoIcon}>
            <Activity size={20} color="white" />
          </View>
          <Text style={styles.headerTitle}>CalAi</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {activeTab === 'home' && <DashboardScreen />}
        {activeTab === 'camera' && <CameraScreen onComplete={() => setActiveTab('home')} />}
        {activeTab === 'history' && <HistoryScreen />}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
          <Home size={24} color={activeTab === 'home' ? '#10b981' : '#9ca3af'} />
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>

        <View style={styles.cameraButtonContainer}>
          <TouchableOpacity style={styles.cameraButton} onPress={() => setActiveTab('camera')}>
            <Camera size={28} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('history')}>
          <List size={24} color={activeTab === 'history' ? '#10b981' : '#9ca3af'} />
          <Text style={[styles.navText, activeTab === 'history' && styles.navTextActive]}>History</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#F2F2F7' },
  headerLogo: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { width: 32, height: 32, backgroundColor: '#10b981', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  content: { flex: 1 },
  navBar: { flexDirection: 'row', height: 80, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingBottom: 20, alignItems: 'center', justifyContent: 'space-around' },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { fontSize: 12, color: '#9ca3af', marginTop: 4, fontWeight: '500' },
  navTextActive: { color: '#10b981' },
  cameraButtonContainer: { position: 'relative', top: -20, alignItems: 'center', justifyContent: 'center' },
  cameraButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
});
