import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Dimensions, Modal, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View as MotiView } from 'moti';
import { useStore, ThemePreference, Language } from '../store/useStore';
import { useAppTheme } from '../utils/Theme';
import { useTranslation } from '../utils/i18n';
import { User, Settings, Bell, Shield, LogOut, ChevronRight, Trash2, Target, Ruler, Weight, Calendar, Moon, Languages, Edit3 } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const { t } = useTranslation();
  const { profile, signOut, updateProfile, themePreference, setThemePreference, language, setLanguage } = useStore();
  const [notifications, setNotifications] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // States for Edit Profile
  const [editData, setEditData] = useState({
    age: profile?.age?.toString() || '',
    birth_date: profile?.birth_date || '',
    weight: profile?.weight?.toString() || '',
    height: profile?.height?.toString() || '',
    daily_calories_goal: profile?.daily_calories_goal?.toString() || '',
    goal: profile?.goal || 'health',
  });

  const toggleTheme = () => {
    const nextTheme: Record<ThemePreference, ThemePreference> = {
      'system': 'light',
      'light': 'dark',
      'dark': 'system'
    };
    setThemePreference(nextTheme[themePreference]);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const getThemeText = () => {
    switch (themePreference) {
      case 'system': return t('profile.themeSystem');
      case 'light': return t('profile.themeLight');
      case 'dark': return t('profile.themeDark');
    }
  };

  const FeatureSoonBadge = () => (
    <View style={styles.comingSoonBadge}>
      <Text style={styles.comingSoonText}>Bientôt</Text>
    </View>
  );

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteText'),
      [
        { text: t('common.cancel'), style: "cancel" },
        { 
          text: t('common.delete'),
          style: "destructive", 
          onPress: () => {
            Alert.alert(t('profile.accountDeleted'), t('profile.accountDeletedText'));
            signOut();
          } 
        }
      ]
    );
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({
        age: parseInt(editData.age) || 0,
        birth_date: editData.birth_date || null,
        weight: parseFloat(editData.weight) || 0,
        height: parseFloat(editData.height) || 0,
        daily_calories_goal: parseInt(editData.daily_calories_goal) || 2000,
        goal: editData.goal as any,
      });
      setShowEditProfile(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('onboarding.saveError'));
    }
  };

  const renderInfoItem = (icon: any, label: string, value: string | number, unit: string = '') => (
    <View style={styles.infoItem}>
      <View style={styles.infoIconContainer}>
        {React.createElement(icon, { size: 18, color: theme.colors.primary })}
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel} numberOfLines={1}>{label}</Text>
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
    <View style={styles.container}>
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('profile.title')}</Text>
      </View>

      {/* User Card */}
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => setShowEditProfile(true)}
        activeOpacity={0.9}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.email?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{profile?.email}</Text>
            <View style={styles.goalBadge}>
              <Text style={styles.goalText}>
                {profile?.goal === 'fat_loss' ? t('onboarding.fatLoss') : profile?.goal === 'muscle_gain' ? t('onboarding.muscleGain') : t('onboarding.health')}
              </Text>
            </View>
          </View>
          <View style={styles.editBadge}>
             <Edit3 size={14} color={theme.colors.secondaryText} />
          </View>
        </View>

        <View style={styles.statsGrid}>
          {renderInfoItem(Weight, t('common.weight'), profile?.weight || 0, ' kg')}
          {renderInfoItem(Ruler, t('common.height'), profile?.height || 0, ' cm')}
          {renderInfoItem(Calendar, t('common.age'), profile?.age || 0, ` ${t('common.years')}`)}
          {renderInfoItem(Target, t('profile.dailyGoal'), profile?.daily_calories_goal || 0, ` ${t('common.kcal')}`)}
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>{t('profile.preferences')}</Text>
      <View style={styles.menuCard}>
        <View style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <Bell size={22} color={theme.colors.text} />
          </View>
          <Text style={styles.menuLabel}>{t('profile.notifications')}</Text>
          <Switch 
            value={notifications} 
            onValueChange={setNotifications}
            trackColor={{ false: theme.colors.separator, true: theme.colors.primary }}
            thumbColor="white"
          />
        </View>
        <View style={styles.separator} />
        {renderMenuItem(Shield, t('profile.privacy'), () => setShowPrivacy(true))}
        <View style={styles.separator} />
        {renderMenuItem(Settings, t('profile.settings'), () => setShowSettings(true))}
        <View style={styles.separator} />
        <TouchableOpacity style={styles.menuItem} disabled={true}>
          <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Target size={20} color="#ef4444" />
          </View>
          <Text style={styles.menuLabel}>Apple Health / Google Fit</Text>
          <FeatureSoonBadge />
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.menuItem} disabled={true}>
          <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
            <Weight size={20} color="#22c55e" />
          </View>
          <Text style={styles.menuLabel}>Suivi du Poids</Text>
          <FeatureSoonBadge />
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
      <View style={styles.menuCard}>
        {renderMenuItem(LogOut, t('profile.signOut'), signOut, theme.colors.orange)}
        <View style={styles.separator} />
        {renderMenuItem(Trash2, t('profile.deleteAccount'), handleDeleteAccount, theme.colors.red, false)}
      </View>

      <Text style={styles.versionText}>Core AI v1.0.0</Text>
    </ScrollView>

      {/* Privacy Policy Modal */}
      <Modal visible={showPrivacy} animationType="slide" presentationStyle="fullScreen" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: insets.top }]}>
            <Text style={styles.modalTitle}>{t('profile.privacy')}</Text>
            <TouchableOpacity onPress={() => setShowPrivacy(false)} style={styles.doneButton}>
              <Text style={styles.modalCloseText}>{t('common.done')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
            <Text style={styles.modalText}>
              {t('profile.privacyText')}
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* App Settings Modal */}
      <Modal visible={showSettings} animationType="slide" presentationStyle="fullScreen" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: insets.top }]}>
            <Text style={styles.modalTitle}>{t('profile.settings')}</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)} style={styles.doneButton}>
              <Text style={styles.modalCloseText}>{t('common.done')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
            <View style={styles.menuCard}>
              <TouchableOpacity style={styles.menuItem} onPress={toggleTheme} activeOpacity={0.7}>
                <View style={styles.menuIconContainer}>
                  <Moon size={22} color={theme.colors.text} />
                </View>
                <Text style={styles.menuLabel}>{t('profile.theme')}</Text>
                <Text style={styles.settingValue}>{getThemeText()}</Text>
              </TouchableOpacity>
              <View style={styles.separator} />
              <TouchableOpacity style={styles.menuItem} onPress={toggleLanguage} activeOpacity={0.7}>
                <View style={styles.menuIconContainer}>
                  <Languages size={22} color={theme.colors.text} />
                </View>
                <Text style={styles.menuLabel}>{t('profile.language')}</Text>
                <Text style={styles.settingValue}>{language === 'fr' ? 'Français' : 'English'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="slide" presentationStyle="fullScreen" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: insets.top }]}>
            <Text style={styles.modalTitle}>{t('profile.editProfile')}</Text>
            <TouchableOpacity onPress={() => setShowEditProfile(false)} style={styles.doneButton}>
              <Text style={styles.modalCloseText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
             <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('common.age')}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editData.age}
                  onChangeText={(v) => setEditData({...editData, age: v})}
                />
             </View>
             <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('profile.birthDate')} (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1990-01-01"
                  placeholderTextColor={theme.colors.secondaryText}
                  value={editData.birth_date || ''}
                  onChangeText={(v) => setEditData({...editData, birth_date: v})}
                />
             </View>
             <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('common.weight')} (kg)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editData.weight}
                  onChangeText={(v) => setEditData({...editData, weight: v})}
                />
             </View>
             <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('common.height')} (cm)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editData.height}
                  onChangeText={(v) => setEditData({...editData, height: v})}
                />
             </View>
             <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('profile.dailyGoal')} (kcal)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editData.daily_calories_goal}
                  onChangeText={(v) => setEditData({...editData, daily_calories_goal: v})}
                />
             </View>

             <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('onboarding.goalTitle')}</Text>
                <View style={styles.goalOptions}>
                  {[
                    { id: 'fat_loss', label: t('onboarding.fatLoss') },
                    { id: 'muscle_gain', label: t('onboarding.muscleGain') },
                    { id: 'health', label: t('onboarding.health') },
                  ].map(opt => (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.goalOption, editData.goal === opt.id && styles.goalOptionActive]}
                      onPress={() => setEditData({ ...editData, goal: opt.id as any })}
                    >
                      <Text style={[styles.goalOptionText, editData.goal === opt.id && styles.goalOptionTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
             </View>

             <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
             </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
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
    ...theme.shadows.medium,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
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
    color: theme.isDark ? 'black' : 'white',
  },
  userInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
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
    color: theme.colors.accent,
  },
  editBadge: {
    padding: 8,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.separator,
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
    flex: 1,
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
    borderRadius: 20,
    marginBottom: theme.spacing.xl,
    overflow: 'hidden',
    ...theme.shadows.soft,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: theme.colors.text,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.separator,
    marginLeft: 60,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.secondaryText,
    marginTop: theme.spacing.lg,
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
    backgroundColor: theme.colors.card,
  },
  doneButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.accent,
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
  },
  comingSoonBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  comingSoonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondaryText,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  goalOptions: {
    gap: 10,
  },
  goalOption: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  goalOptionActive: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  goalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  goalOptionTextActive: {
    color: theme.colors.accent,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
    ...theme.shadows.medium,
  },
  saveButtonText: {
    color: theme.isDark ? 'black' : 'white',
    fontSize: 17,
    fontWeight: '700',
  },
});
