import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { supabase } from '../services/supabase';
import { useAppTheme } from '../utils/Theme';
import { useTranslation } from '../utils/i18n';
import { View as MotiView } from 'moti';
import { Activity, Mail, Lock, ArrowRight } from 'lucide-react-native';

export default function AuthScreen() {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.fillFields'));
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Success', t('auth.successSignUp'));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <MotiView 
          from={{ opacity: 0, scale: 0.5 } as any}
          animate={{ opacity: 1, scale: 1 } as any}
          style={styles.logoContainer}
        >
          <View style={styles.logoIcon}>
            <Activity size={40} color="white" />
          </View>
        </MotiView>
        <Text style={styles.logoText}>Core AI</Text>
        <Text style={styles.logoSub}>Your AI Nutrition Partner</Text>

        <MotiView 
          from={{ opacity: 0, translateY: 20 } as any}
          animate={{ opacity: 1, translateY: 0 } as any}
          transition={{ delay: 200 } as any}
          style={styles.form}
        >
          <Text style={styles.title}>{isSignUp ? t('auth.createAccount') : t('auth.welcomeBack')}</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? t('auth.signUpSub') : t('auth.signInSub')}
          </Text>

          <View style={styles.inputContainer}>
            <Mail size={20} color={theme.colors.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={theme.colors.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.isDark ? "black" : "white"} />
            ) : (
              <>
                <Text style={styles.buttonText}>{isSignUp ? t('auth.signUp') : t('auth.signIn')}</Text>
                <ArrowRight size={20} color={theme.isDark ? "black" : "white"} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton} 
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchText}>
              {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
            </Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    width: 80,
    height: 80,
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  logoSub: {
    fontSize: 16,
    color: theme.colors.secondaryText,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    backgroundColor: theme.colors.card,
    borderRadius: 32,
    padding: 24,
    ...theme.shadows.medium,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.secondaryText,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.separator,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    ...theme.shadows.medium,
  },
  buttonText: {
    color: theme.isDark ? 'black' : 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: theme.spacing.sm,
  },
  switchButton: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  switchText: {
    color: theme.colors.secondaryText,
    fontSize: 14,
    fontWeight: '600',
  },
});
