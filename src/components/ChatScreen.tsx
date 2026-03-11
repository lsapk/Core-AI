import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { View as MotiView } from 'moti';
import { FlashList } from '@shopify/flash-list';
import { useStore, ChatMessage } from '../store/useStore';
import { Theme } from '../utils/Theme';
import { Send, Bot } from 'lucide-react-native';
import { chatWithAI } from '../services/gemini';

export default function ChatScreen() {
  const { messages, addMessage, addMeal, addWater } = useStore();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flashListRef = useRef<any>(null);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    addMessage({ role: 'user', text: userMessage });
    setIsTyping(true);

    try {
      const response = await chatWithAI(userMessage);
      
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
            });
            addMessage({ role: 'model', text: `J'ai ajouté ${args.foodName} (${args.calories} kcal) à ton journal ! 🥗` });
          } else if (call.name === 'add_water') {
            const args = call.args as any;
            addWater(args.amountMl);
            addMessage({ role: 'model', text: `C'est noté ! +${args.amountMl}ml d'eau. 💧` });
          }
        }
      } else {
        addMessage({ role: 'model', text: response.text || "C'est fait ! 👍" });
      }
    } catch (error) {
      console.error(error);
      addMessage({ role: 'model', text: "Désolé, j'ai eu un petit problème technique. Peux-tu répéter ?" });
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                <Text style={[
                  styles.messageText,
                  item.role === 'user' ? styles.userText : styles.botText
                ]}>
                  {item.text}
                </Text>
              </View>
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </MotiView>
          ),
          ListEmptyComponent: (
            <View style={styles.emptyContainer}>
              <Bot size={48} color={Theme.colors.primary} />
              <Text style={styles.emptyTitle}>Salut ! Je suis ton assistant Core AI.</Text>
              <Text style={styles.emptySub}>Dis-moi ce que tu as mangé ou bu, ou pose-moi une question sur ta nutrition !</Text>
            </View>
          )
        } as any)}
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={Theme.colors.primary} />
          <Text style={styles.typingText}>Core AI réfléchit...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Dis-moi tout..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
          onPress={handleSend}
          disabled={!inputText.trim() || isTyping}
        >
          <Send size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  listContent: { padding: Theme.spacing.lg, paddingBottom: 20 },
  messageWrapper: { marginBottom: Theme.spacing.md, maxWidth: '85%' },
  userWrapper: { alignSelf: 'flex-end' },
  botWrapper: { alignSelf: 'flex-start' },
  messageBubble: {
    padding: Theme.spacing.md,
    borderRadius: 20,
    ...Theme.shadows.soft,
  },
  userBubble: {
    backgroundColor: Theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: Theme.colors.card,
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 16, lineHeight: 22 },
  userText: { color: 'white', fontWeight: '500' },
  botText: { color: Theme.colors.text },
  timestamp: {
    fontSize: 10,
    color: Theme.colors.secondaryText,
    marginTop: 4,
    marginHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.card,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.text,
    textAlign: 'center',
    marginTop: 20,
  },
  emptySub: {
    fontSize: 14,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: 10,
  },
  typingText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginLeft: 8,
    fontStyle: 'italic',
  },
});
