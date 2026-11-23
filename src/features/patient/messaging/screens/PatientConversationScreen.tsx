import React, { useEffect, useRef, useState } from 'react';
import { usePatientMessagesStore } from '../state/use-patient-messages-store';
import { Message, MessageStatus } from '../../../../types/communication';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';
import { spacing, typography, shapes } from '../../../../theme/tokens';

function statusLabel(s: MessageStatus): string {
  switch (s) {
    case 'sending': return 'Envoi...';
    case 'sent': return 'Envoyé';
    case 'read': return 'Lu';
  }
}

function timeAgo(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const PatientConversationScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { conversation, isLoading, errorMessage, load, openConversation, sendMessage } = usePatientMessagesStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    load();
  }, [load]);

  // Mark as read when opened (Flutter: openConversation calls markRead with viewer=patient)
  useEffect(() => {
    if (conversation && conversation.unreadCount > 0) {
      openConversation(conversation.id);
    }
  }, [conversation?.id, conversation?.unreadCount, openConversation]);

  const onSend = async () => {
    if (text.trim() === '' || sending) return;
    setSending(true);
    const ok = await sendMessage(text);
    setSending(false);
    if (ok) {
      setText('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } else {
      Alert.alert("Erreur", "Impossible d'envoyer le message.");
    }
  };

  if (!conversation) {
    return (
      <View style={styles.center}>
        {isLoading ? <ActivityIndicator size="large" color={colors.primary} /> : (
          <>
            <Text style={styles.errorTitle}>Aucune conversation</Text>
            {errorMessage && <Text style={styles.errorBody}>{errorMessage}</Text>}
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.headerName}>{conversation.patientName}</Text>
        <Text style={styles.headerSummary}>{conversation.patientSummary}</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {conversation.messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </ScrollView>

      <View style={styles.composerRow}>
        <TextInput
          style={styles.composerInput}
          value={text}
          onChangeText={setText}
          placeholder="Écrire un message…"
          multiline
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (text.trim() === '' || sending) && styles.sendButtonDisabled]}
          onPress={onSend}
          disabled={text.trim() === '' || sending}
        >
          <Text style={styles.sendButtonText}>{sending ? '...' : 'Envoyer'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

function MessageBubble({ message }: { message: Message }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const isPatient = message.sender === 'patient';
  return (
    <View style={[styles.bubble, isPatient ? styles.bubblePatient : styles.bubbleOther]}>
      {message.actionLabel && message.actionRoute && (
        <View style={styles.actionBadge}>
          <Text style={styles.actionBadgeText}>{message.actionLabel}</Text>
        </View>
      )}
      <Text style={[styles.bubbleText, isPatient && styles.bubbleTextPatient]}>{message.text}</Text>
      <Text style={[styles.bubbleTime, isPatient && styles.bubbleTimePatient]}>
        {timeAgo(message.createdAt)} · {statusLabel(message.status)}
      </Text>
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background },
  headerCard: { backgroundColor: colors.primary, padding: 16 },
  headerName: { fontSize: 18, fontWeight: '700', color: colors.primaryForeground },
  headerSummary: { fontSize: 12, color: colors.accent, marginTop: 2 },
  messageList: { flex: 1 },
  messageListContent: { padding: 12 },
  bubble: { backgroundColor: colors.primaryForeground, borderRadius: 12, padding: 12, marginBottom: 8, maxWidth: '85%' },
  bubbleOther: { alignSelf: 'flex-start' },
  bubblePatient: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  actionBadge: { backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6 },
  actionBadgeText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  bubbleText: { fontSize: 14, color: colors.primary, lineHeight: 20 },
  bubbleTextPatient: { color: colors.primaryForeground },
  bubbleTime: { fontSize: 11, color: colors.mutedForeground, marginTop: 4 },
  bubbleTimePatient: { color: colors.accent },
  composerRow: { flexDirection: 'row', padding: 8, backgroundColor: colors.primaryForeground, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'flex-end' },
  composerInput: { flex: 1, backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, maxHeight: 100, fontSize: 14 },
  sendButton: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, marginLeft: 8, minHeight: 44, justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: colors.mutedForeground },
  sendButtonText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 8, textAlign: 'center' },
  errorBody: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center' },
});
}

export default PatientConversationScreen;