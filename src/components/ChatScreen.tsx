import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard } from 'react-native';
import { View as MotiView } from 'moti';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useStore, ChatMessage } from '../store/useStore';
import { useAppTheme } from '../utils/Theme';
import { Send, Bot } from 'lucide-react-native';
import { chatWithAI } from '../services/gemini';
import Markdown from 'react-native-markdown-display';

export default function ChatScreen() {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();
  const { messages, addMessage, addMeal, addWater, meals, profile } = useStore();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const flashListRef = useRef<any>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    addMessage({ role: 'user', text: userMessage });
    setIsTyping(true);

    // 1. Calcul du contexte journalier strict
    const todayISO = new Date().toISOString().split('T')[0];
    const todayDateStr = new Date().toLocaleDateString('fr-FR');
    const todayMeals = meals.filter(m => m.date.startsWith(todayISO));
    
    const totalCals = todayMeals.reduce((acc, m) => acc + m.calories, 0);
    const totalProtein = todayMeals.reduce((acc, m) => acc + m.protein, 0);
    const totalCarbs = todayMeals.reduce((acc, m) => acc + m.carbs, 0);
    const totalFat = todayMeals.reduce((acc, m) => acc + m.fat, 0);

    const dailyContext = `Calories: ${totalCals}/${profile?.daily_calories_goal || 2000} kcal, Protéines: ${totalProtein}/${profile?.protein_goal || 150}g, Glucides: ${totalCarbs}/${profile?.carbs_goal || 200}g, Lipides: ${totalFat}/${profile?.fat_goal || 65}g`;

    // 2. Préparation de l'historique (les 6 derniers messages pour la cohérence sans exploser les tokens)
    const chatHistory = messages.slice(-6).map(m => ({
      role: m.role,
      text: m.text
    }));

    try {
      // 3. Appel avec le cerveau "reconnecté" à la base de données
      const response = await chatWithAI(userMessage, chatHistory, dailyContext, todayDateStr);
      
      // 4. CORRECTION DU BUG: On gère l'enregistrement en base ET l'affichage textuel indépendamment
      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          if (call.name === 'add_meal') {
            const args = call.args as any;
            await addMeal({
              date: new Date().toISOString(),
              foodName: args.foodName,
              calories: args.calories,
              protein: args.protein || 0,
              carbs: args.carbs || 0,
              fat: args.fat || 0,
              servings: args.servings || 1,
            });
          } else if (call.name === 'add_water') {
            const args = call.args as any;
            addWater(args.amountMl);
          }
        }
      } 
      
      // On affiche TOUJOURS le texte de l'IA (le fameux tableau Markdown) s'il existe
      if (response.text) {
        addMessage({ role: 'model', text: response.text });
      } else if (!response.text && response.functionCalls) {
        // Fallback de sécurité au cas où l'IA n'a retourné QUE le tool call
        addMessage({ role: 'model', text: "Données enregistrées dans ton journal." });
      }

    } catch (error) {
      console.error(error);
      addMessage({ role: 'model', text: "Erreur d'analyse. Merci de réessayer." });
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      flashListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, isTyping]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlashList
        {...({
          ref: flashListRef,
          data: messages,
          keyExtractor: (item: ChatMessage) => item.id,
          estimatedItemSize: 80,
          contentContainerStyle: styles.listContent,
          renderItem: ({ item }: { item: ChatMessage }) => (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={[
                styles.messageWrapper,
                item.role === 'user' ? styles.userWrapper : styles.botWrapper
              ]}
            >
              <View style={[
                styles.messageBubble,
                item.role === 'user' ? styles.userBubble : styles.botBubble
              ]}>
                {item.role === 'user' ? (
                  <Text style={[
                    styles.messageText,
                    styles.userText
                  ]}>
                    {item.text}
                  </Text>
                ) : (
                  <Markdown style={markdownStyles(theme)}>
                    {item.text}
                  </Markdown>
                )}
              </View>
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </MotiView>
          ),
          ListEmptyComponent: (
            <View style={styles.emptyContainer}>
              <Bot size={48} color={theme.colors.primary} />
              <Text style={styles.emptyTitle}>Salut ! Je suis ton assistant Core AI.</Text>
              <Text style={styles.emptySub}>Dis-moi ce que tu as mangé ou bu, ou pose-moi une question sur ta nutrition !</Text>
            </View>
          )
        } as any)}
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.typingText}>Core AI réfléchit...</Text>
        </View>
      )}

      <BlurView intensity={theme.isDark ? 80 : 60} tint={theme.isDark ? "dark" : "light"} style={[styles.inputContainer, { paddingBottom: isKeyboardVisible ? theme.spacing.sm : Math.max(insets.bottom, 20) + 65 }]}>
        <TextInput
          style={styles.input}
          placeholder="Dis-moi tout..."
          placeholderTextColor={theme.colors.secondaryText}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
          onPress={handleSend}
          disabled={!inputText.trim() || isTyping}
          activeOpacity={0.7}
        >
          <Send size={18} color="white" style={{ marginLeft: -2 }} />
        </TouchableOpacity>
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const markdownStyles = (theme: ReturnType<typeof useAppTheme>) => ({
  body: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  table: {
    borderWidth: 1,
    borderColor: theme.colors.separator,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  tr: {
    borderBottomWidth: 1,
    borderColor: theme.colors.separator,
    flexDirection: 'row' as const,
  },
  th: {
    padding: 8,
    fontWeight: 'bold' as const,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    flex: 1,
  },
  td: {
    padding: 8,
    color: theme.colors.text,
    flex: 1,
  },
  strong: {
    fontWeight: 'bold' as const,
    color: theme.colors.text,
  },
  em: {
    fontStyle: 'italic' as const,
    color: theme.colors.text,
  },
  p: {
    marginTop: 4,
    marginBottom: 4,
  }
});

const getStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  listContent: { padding: theme.spacing.lg, paddingBottom: 20 },
  messageWrapper: { marginBottom: theme.spacing.md, maxWidth: '85%' },
  userWrapper: { alignSelf: 'flex-end' },
  botWrapper: { alignSelf: 'flex-start' },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    ...theme.shadows.soft,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 16, lineHeight: 22 },
  userText: { color: 'white', fontWeight: '500' },
  botText: { color: theme.colors.text },
  timestamp: {
    fontSize: 11,
    color: theme.colors.secondaryText,
    marginTop: 6,
    marginHorizontal: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.separator,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 40,
    marginRight: 12,
    color: theme.colors.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.separator,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: { opacity: 0.5 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: -0.5,
  },
  emptySub: {
    fontSize: 15,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 12,
  },
  typingText: {
    fontSize: 13,
    color: theme.colors.secondaryText,
    marginLeft: 8,
    fontWeight: '500',
  },
});
