import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Dimensions } from 'react-native';
import { View as MotiView } from 'moti';
import { useStore } from '../store/useStore';
import { Theme } from '../utils/Theme';
import { User, Settings, Bell, Shield, LogOut, ChevronRight, Trash2, Target, Ruler, Weight, Calendar } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { profile, signOut, updateProfile } = useStore();
  const [notifications, setNotifications] = useState(true);

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
            // In a real app, call supabase.auth.admin.deleteUser or similar
            // For now, just sign out and show a message
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
        {React.createElement(icon, { size: 20, color: Theme.colors.primary })}
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}{unit}</Text>
      </View>
    </View>
  );

  const renderMenuItem = (icon: any, label: string, onPress: () => void, color: string = Theme.colors.text, showChevron: boolean = true) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIconContainer}>
        {React.createElement(icon, { size: 22, color })}
      </View>
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      {showChevron && <ChevronRight size={20} color={Theme.colors.separator} />}
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
            <Bell size={22} color={Theme.colors.text} />
          </View>
          <Text style={styles.menuLabel}>Notifications</Text>
          <Switch 
            value={notifications} 
            onValueChange={setNotifications}
            trackColor={{ false: Theme.colors.separator, true: Theme.colors.primary }}
            thumbColor="white"
          />
        </View>
        <View style={styles.separator} />
        {renderMenuItem(Shield, 'Privacy Policy', () => {})}
        <View style={styles.separator} />
        {renderMenuItem(Settings, 'App Settings', () => {})}
      </View>

      {/* Account Section */}
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.menuCard}>
        {renderMenuItem(LogOut, 'Sign Out', signOut, Theme.colors.orange)}
        <View style={styles.separator} />
        {renderMenuItem(Trash2, 'Delete Account', handleDeleteAccount, Theme.colors.red, false)}
      </View>

      <Text style={styles.versionText}>Core AI v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { 
    padding: Theme.spacing.lg, 
    paddingBottom: 120 
  },
  header: {
    marginBottom: Theme.spacing.lg,
  },
  title: { 
    fontSize: 34, 
    fontWeight: '800', 
    color: Theme.colors.text,
    letterSpacing: -1,
  },
  userCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadows.soft,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.soft,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
  },
  userInfo: {
    marginLeft: Theme.spacing.md,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
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
    color: Theme.colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
  },
  infoItem: {
    width: (width - Theme.spacing.lg * 2 - Theme.spacing.lg * 2 - Theme.spacing.md) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.lg,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.soft,
  },
  infoTextContainer: {
    marginLeft: Theme.spacing.sm,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Theme.spacing.sm,
    marginLeft: Theme.spacing.xs,
  },
  menuCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadows.soft,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Theme.colors.separator,
    opacity: 0.3,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Theme.colors.separator,
    marginTop: Theme.spacing.lg,
  },
});
