import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { AppHeader } from '../../../components';
import { useLocale, t, isRTL } from '../../../localization';
import { useTheme } from '../../../theme/ThemeContext';

interface Message {
  id: string;
  sender: 'user' | 'nurse';
  text: string;
  timestamp: string;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesList: { flexGrow: 1, padding: spacing.lg, gap: spacing.sm },
  headerNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: shapes.md,
    marginBottom: spacing.xs,
  },
  noticeText: {
    flex: 1,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  emptyText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
});

export default function PatientMessagesScreen() {
  const { colors } = useTheme();
  const locale = useLocale();
  const rtl = isRTL(locale);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(
        { fr: 'fr-FR', en: 'en-GB', ar: 'ar' }[locale],
        { hour: '2-digit', minute: '2-digit' },
      ),
    };
    setMessages((previous) => [...previous, newMessage]);
    setInputText('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('patient.messages.title', locale)} />

      <ScrollView
        contentContainerStyle={[styles.messagesList, { direction: rtl ? 'rtl' : 'ltr' }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.headerNotice, { backgroundColor: colors.infoBackground }]}>
          <Icon name="info" size={18} color={colors.info} />
          <Text style={[styles.noticeText, { color: colors.foreground }]}>
            {t('patient.messages.demoNotice', locale)}
          </Text>
        </View>

        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="message-square" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {t('patient.messages.empty', locale)}
            </Text>
          </View>
        ) : (
          messages.map((message) => {
            const isUserMessage = message.sender === 'user';
            const alignment = isUserMessage
              ? (rtl ? 'flex-start' : 'flex-end')
              : (rtl ? 'flex-end' : 'flex-start');
            return (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  isUserMessage
                    ? {
                        backgroundColor: colors.primary,
                        alignSelf: alignment,
                        borderBottomRightRadius: rtl ? shapes.md : 2,
                        borderBottomLeftRadius: rtl ? 2 : shapes.md,
                      }
                    : {
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignSelf: alignment,
                        borderBottomLeftRadius: rtl ? shapes.md : 2,
                        borderBottomRightRadius: rtl ? 2 : shapes.md,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    { color: isUserMessage ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    {
                      color: isUserMessage ? colors.primaryForeground : colors.mutedForeground,
                      opacity: isUserMessage ? 0.8 : 1,
                    },
                  ]}
                >
                  {message.timestamp}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <View
        style={[
          styles.composer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            direction: rtl ? 'rtl' : 'ltr',
          },
        ]}
      >
        <TextInput
          style={[
            styles.composerInput,
            { backgroundColor: colors.surfaceVariant, color: colors.foreground },
          ]}
          placeholder={t('patient.messages.composerPlaceholder', locale)}
          placeholderTextColor={colors.mutedForeground}
          value={inputText}
          onChangeText={setInputText}
          accessibilityLabel={t('patient.messages.composerLabel', locale)}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.primary },
            !inputText.trim() && styles.disabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
          accessibilityRole="button"
          accessibilityLabel={t('patient.messages.addPreview', locale)}
          accessibilityState={{ disabled: !inputText.trim() }}
        >
          <Icon name="send" size={18} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
