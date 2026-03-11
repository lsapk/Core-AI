import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { Theme } from '../utils/Theme';
import { MotiView } from 'moti';
import { Activity, Mail, Lock, ArrowRight } from 'lucide-react-native';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Success', 'Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
            <Activity size={40} color="white" strokeWidth={3} />
          </View>
          <Text style={styles.logoText}>Core AI</Text>
          <Text style={styles.logoSub}>Your AI Nutrition Partner</Text>
        </MotiView>

        <MotiView 
          from={{ opacity: 0, translateY: 20 } as any}
          animate={{ opacity: 1, translateY: 0 } as any}
          transition={{ delay: 200 } as any}
          style={styles.form}
        >
          <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Start your fitness journey today' : 'Sign in to continue tracking'}
          </Text>

          <View style={styles.inputContainer}>
            <Mail size={20} color={Theme.colors.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={Theme.colors.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
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
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
                <ArrowRight size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton} 
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchText}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    padding: Theme.spacing.xl,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoIcon: {
    width: 80,
    height: 80,
    backgroundColor: Theme.colors.primary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.medium,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: Theme.colors.text,
    letterSpacing: -1,
  },
  logoSub: {
    fontSize: 16,
    color: Theme.colors.secondaryText,
    fontWeight: '500',
  },
  form: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.xl,
    ...Theme.shadows.medium,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Theme.colors.secondaryText,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    height: 56,
  },
  inputIcon: {
    marginRight: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.text,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    height: 56,
    borderRadius: Theme.radius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    ...Theme.shadows.soft,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: Theme.spacing.sm,
  },
  switchButton: {
    marginTop: Theme.spacing.xl,
    alignItems: 'center',
  },
  switchText: {
    color: Theme.colors.secondaryText,
    fontSize: 14,
    fontWeight: '600',
  },
});
