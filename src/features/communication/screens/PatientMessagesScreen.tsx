import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { AppHeader } from '../../../components';
import { useTheme } from '../../../theme/ThemeContext';

interface Message {
  id: string;
  sender: 'user' | 'nurse';
  text: string;
  timestamp: string;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesList: { padding: spacing.lg, gap: spacing.sm },
  headerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: shapes.sm,
    marginBottom: spacing.xs,
  },
  noticeText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: shapes.md,
    marginVertical: 2,
  },
  messageText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  timestamp: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  composerInput: {
    flex: 1,
    borderRadius: shapes.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxHeight: 100,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


export default function PatientMessagesScreen() {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'nurse',
      text: 'Bonjour Mr. Dupont. J\'ai bien reçu votre suivi de ce matin. Votre SpO2 à 96% est très stable.',
      timestamp: '09:15',
    },
    {
      id: '2',
      sender: 'user',
      text: 'Merci infirmière Sarah. J\'ai eu une légère toux ce matin mais ça va mieux.',
      timestamp: '09:42',
    },
    {
      id: '3',
      sender: 'nurse',
      text: 'N\'hésitez pas à prendre une bouffée de Ventoline si la toux persiste.',
      timestamp: '10:05',
    },
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Discussion avec l'équipe" />
      
      {/* Messages Thread */}
      <ScrollView contentContainerStyle={styles.messagesList}>
        <View style={[styles.headerNotice, { backgroundColor: colors.secondary }]}>
          <Icon name="shield" size={16} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.primary }]}>Échanges sécurisés avec l'équipe soignante Sanad</Text>
        </View>

        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.sender === 'user'
                ? { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 2 }
                : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
            ]}
          >
            <Text
              style={[
                styles.messageText,
                { color: msg.sender === 'user' ? colors.primaryForeground : colors.foreground },
              ]}
            >
              {msg.text}
            </Text>
            <Text
              style={[
                styles.timestamp,
                { color: msg.sender === 'user' ? colors.primaryForeground : colors.mutedForeground, opacity: msg.sender === 'user' ? 0.8 : 1 },
              ]}
            >
              {msg.timestamp}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Composer Input Bar */}
      <View style={[styles.composer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.composerInput, { backgroundColor: colors.surfaceVariant, color: colors.foreground }]}
          placeholder="Écrire un message..."
          placeholderTextColor={colors.mutedForeground}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.primary }]} onPress={sendMessage}>
          <Icon name="send" size={18} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}


