import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Dimensions, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View as MotiView } from 'moti';
import { useStore, ThemePreference } from '../store/useStore';
import { useAppTheme } from '../utils/Theme';
import { User, Settings, Bell, Shield, LogOut, ChevronRight, Trash2, Target, Ruler, Weight, Calendar, Moon } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const { profile, signOut, updateProfile, themePreference, setThemePreference } = useStore();
  const [notifications, setNotifications] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const toggleTheme = () => {
    const nextTheme: Record<ThemePreference, ThemePreference> = {
      'system': 'light',
      'light': 'dark',
      'dark': 'system'
    };
    setThemePreference(nextTheme[themePreference]);
  };

  const getThemeText = () => {
    switch (themePreference) {
      case 'system': return 'System Default';
      case 'light': return 'Light Mode';
      case 'dark': return 'Dark Mode';
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            Alert.alert("Account Deleted", "Your account has been successfully removed.");
            signOut();
          } 
        }
      ]
    );
  };

  const renderInfoItem = (icon: any, label: string, value: string | number, unit: string = '') => (
    <View style={styles.infoItem}>
      <View style={styles.infoIconContainer}>
        {React.createElement(icon, { size: 20, color: theme.colors.primary })}
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}{unit}</Text>
      </View>
    </View>
  );

  const renderMenuItem = (icon: any, label: string, onPress: () => void, color: string = theme.colors.text, showChevron: boolean = true) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIconContainer}>
        {React.createElement(icon, { size: 22, color })}
      </View>
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      {showChevron && <ChevronRight size={20} color={theme.colors.separator} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <MotiView 
        from={{ opacity: 0, translateY: 10 } as any}
        animate={{ opacity: 1, translateY: 0 } as any}
        style={styles.header}
      >
        <Text style={styles.title}>Profile</Text>
      </MotiView>

      {/* User Card */}
      <MotiView 
        from={{ opacity: 0, scale: 0.9 } as any}
        animate={{ opacity: 1, scale: 1 } as any}
        transition={{ type: 'spring', delay: 100 } as any}
        style={styles.userCard}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.email?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{profile?.email}</Text>
            <View style={styles.goalBadge}>
              <Text style={styles.goalText}>
                {profile?.goal === 'fat_loss' ? 'Lose Fat' : profile?.goal === 'muscle_gain' ? 'Gain Muscle' : 'Health Focus'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {renderInfoItem(Weight, 'Weight', profile?.weight || 0, ' kg')}
          {renderInfoItem(Ruler, 'Height', profile?.height || 0, ' cm')}
          {renderInfoItem(Calendar, 'Age', profile?.age || 0, ' yrs')}
          {renderInfoItem(Target, 'Daily Goal', profile?.daily_calories_goal || 0, ' kcal')}
        </View>
      </MotiView>

      {/* Settings Section */}
      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.menuCard}>
        <View style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <Bell size={22} color={theme.colors.text} />
          </View>
          <Text style={styles.menuLabel}>Notifications</Text>
          <Switch 
            value={notifications} 
            onValueChange={setNotifications}
            trackColor={{ false: theme.colors.separator, true: theme.colors.primary }}
            thumbColor="white"
          />
        </View>
        <View style={styles.separator} />
        {renderMenuItem(Shield, 'Privacy Policy', () => setShowPrivacy(true))}
        <View style={styles.separator} />
        {renderMenuItem(Settings, 'App Settings', () => setShowSettings(true))}
      </View>

      {/* Account Section */}
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.menuCard}>
        {renderMenuItem(LogOut, 'Sign Out', signOut, theme.colors.orange)}
        <View style={styles.separator} />
        {renderMenuItem(Trash2, 'Delete Account', handleDeleteAccount, theme.colors.red, false)}
      </View>

      <Text style={styles.versionText}>Core AI v1.0.0</Text>

      {/* Privacy Policy Modal */}
      <Modal visible={showPrivacy} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <TouchableOpacity onPress={() => setShowPrivacy(false)}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalText}>
              Your privacy is important to us. This application collects minimal data required to function, such as your email for authentication and your meal logs to provide nutritional insights.
              {'\n\n'}
              We do not sell your personal data to third parties. Images you capture are processed securely to extract nutritional information.
              {'\n\n'}
              By using this app, you agree to our terms of service and privacy policy.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* App Settings Modal */}
      <Modal visible={showSettings} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>App Settings</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.menuCard}>
              <TouchableOpacity style={styles.menuItem} onPress={toggleTheme} activeOpacity={0.7}>
                <View style={styles.menuIconContainer}>
                  <Moon size={22} color={theme.colors.text} />
                </View>
                <Text style={styles.menuLabel}>Theme</Text>
                <Text style={styles.settingValue}>{getThemeText()}</Text>
              </TouchableOpacity>
              <View style={styles.separator} />
              <View style={styles.menuItem}>
                <View style={styles.menuIconContainer}>
                  <Settings size={22} color={theme.colors.text} />
                </View>
                <Text style={styles.menuLabel}>Language</Text>
                <Text style={styles.settingValue}>English</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { flex: 1 },
  content: { 
    padding: theme.spacing.lg, 
    paddingBottom: 120 
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: { 
    fontSize: 34, 
    fontWeight: '800', 
    color: theme.colors.text,
    letterSpacing: -1,
  },
  userCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.soft,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
  },
  userInfo: {
    marginLeft: theme.spacing.md,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  goalBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  goalText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  infoItem: {
    width: (width - theme.spacing.lg * 2 - theme.spacing.lg * 2 - theme.spacing.md) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  infoTextContainer: {
    marginLeft: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.secondaryText,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
  },
  menuCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    marginBottom: theme.spacing.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.separator,
    marginLeft: 58,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.separator,
    marginTop: theme.spacing.lg,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
    backgroundColor: theme.colors.card,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  modalContent: {
    padding: theme.spacing.lg,
  },
  modalText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
  },
  settingValue: {
    fontSize: 16,
    color: theme.colors.secondaryText,
  }
});
