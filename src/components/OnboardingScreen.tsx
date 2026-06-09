import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useStore } from '../store/useStore';
import { useAppTheme } from '../utils/Theme';
import { View as MotiView, AnimatePresence } from 'moti';
import { ChevronRight, ChevronLeft, Target, User, Ruler, Weight, Activity } from 'lucide-react-native';

const STEPS = [
  { id: 'goal', title: 'What is your goal?', icon: Target },
  { id: 'info', title: 'About you', icon: User },
  { id: 'activity', title: 'Activity level', icon: Activity },
];

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    goal: 'health',
    gender: 'male',
    age: '',
    weight: '',
    height: '',
    activity_level: 'moderate',
  });

  const updateProfile = useStore(state => state.updateProfile);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const calculateMacros = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseInt(formData.age);
    
    // Simple BMR calculation (Mifflin-St Jeor)
    let bmr = 0;
    if (formData.gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    let tdee = bmr * activityMultipliers[formData.activity_level as keyof typeof activityMultipliers];

    // Adjust based on goal
    let calories = Math.round(tdee);
    if (formData.goal === 'fat_loss') calories -= 500;
    if (formData.goal === 'muscle_gain') calories += 300;

    // Split macros (approximate)
    // Protein: 2g per kg for muscle gain/fat loss, 1.5g for health
    const proteinPerKg = formData.goal === 'health' ? 1.5 : 2;
    const protein = Math.round(weight * proteinPerKg);
    const fat = Math.round((calories * 0.25) / 9);
    const carbs = Math.round((calories - (protein * 4 + fat * 9)) / 4);

    return { calories, protein, fat, carbs };
  };

  const finishOnboarding = async () => {
    if (!formData.age || !formData.weight || !formData.height) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const macros = calculateMacros();
      await updateProfile({
        ...formData,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        daily_calories_goal: macros.calories,
        protein_goal: macros.protein,
        carbs_goal: macros.carbs,
        fat_goal: macros.fat,
        onboarding_completed: true,
      } as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const renderStep = () => {
    const CurrentStep = STEPS[step];
    
    return (
      <MotiView
        key={step}
        from={{ opacity: 0, translateX: 50 } as any}
        animate={{ opacity: 1, translateX: 0 } as any}
        exit={{ opacity: 0, translateX: -50 } as any}
        style={styles.stepContainer}
      >
        <View style={styles.stepHeader}>
          <View style={styles.stepIcon}>
            <CurrentStep.icon size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.stepTitle}>{CurrentStep.title}</Text>
        </View>

        {step === 0 && (
          <View style={styles.optionsContainer}>
            {[
              { id: 'fat_loss', label: 'Lose Fat', desc: 'Burn fat and get lean' },
              { id: 'muscle_gain', label: 'Gain Muscle', desc: 'Build strength and mass' },
              { id: 'health', label: 'Improve Health', desc: 'Maintain and feel better' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.option, formData.goal === opt.id && styles.optionActive]}
                onPress={() => setFormData({ ...formData, goal: opt.id as any })}
              >
                <Text style={[styles.optionLabel, formData.goal === opt.id && styles.optionLabelActive]}>{opt.label}</Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 1 && (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {['male', 'female'].map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, formData.gender === g && styles.genderBtnActive]}
                    onPress={() => setFormData({ ...formData, gender: g as any })}
                  >
                    <Text style={[styles.genderText, formData.gender === g && styles.genderTextActive]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Years"
                  keyboardType="numeric"
                  value={formData.age}
                  onChangeText={v => setFormData({ ...formData, age: v })}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="kg"
                  keyboardType="numeric"
                  value={formData.weight}
                  onChangeText={v => setFormData({ ...formData, weight: v })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 16 }]}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="cm"
                  keyboardType="numeric"
                  value={formData.height}
                  onChangeText={v => setFormData({ ...formData, height: v })}
                />
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.optionsContainer}>
            {[
              { id: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
              { id: 'light', label: 'Lightly Active', desc: 'Exercise 1-3 times/week' },
              { id: 'moderate', label: 'Moderately Active', desc: 'Exercise 3-5 times/week' },
              { id: 'active', label: 'Active', desc: 'Exercise 6-7 times/week' },
              { id: 'very_active', label: 'Very Active', desc: 'Hard exercise daily' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.option, formData.activity_level === opt.id && styles.optionActive]}
                onPress={() => setFormData({ ...formData, activity_level: opt.id as any })}
              >
                <Text style={[styles.optionLabel, formData.activity_level === opt.id && styles.optionLabelActive]}>{opt.label}</Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </MotiView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressDots}>
          {STEPS.map((_, i) => (
            <View 
              key={i} 
              style={[styles.dot, i <= step && styles.dotActive]} 
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AnimatePresence mode="wait" {...({} as any)}>
          {renderStep()}
        </AnimatePresence>
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <ChevronLeft size={24} color={theme.colors.secondaryText} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>{step === STEPS.length - 1 ? 'Get Started' : 'Next'}</Text>
          <ChevronRight size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.separator,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  stepContainer: {
    flex: 1,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.separator,
    ...theme.shadows.soft,
  },
  optionActive: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  optionLabelActive: {
    color: theme.colors.primary,
  },
  optionDesc: {
    fontSize: 15,
    color: theme.colors.secondaryText,
  },
  formContainer: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.secondaryText,
    marginLeft: 4,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.separator,
    ...theme.shadows.soft,
  },
  genderBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  genderTextActive: {
    color: 'white',
  },
  inputRow: {
    flexDirection: 'row',
  },
  input: {
    height: 56,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.separator,
    ...theme.shadows.soft,
  },
  footer: {
    padding: theme.spacing.xl,
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondaryText,
  },
  nextBtn: {
    flex: 1,
    marginLeft: 20,
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...theme.shadows.soft,
  },
  nextText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
});
