import React, { useEffect, useState } from 'react';
import { usePatientMessagesStore } from '../state/use-patient-messages-store';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

const PatientMessagesScreen: React.FC<{ onNavigate?: (screen: string) => void }> = ({ onNavigate }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { conversations, tasks, isLoading, errorMessage, load, hasOpenTasks, openTasks } = usePatientMessagesStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const conversation = conversations[0]; // Patient has 1 conversation in mock

  if (isLoading && conversations.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="colors.primary" />
      </View>
    );
  }

  if (errorMessage && conversations.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Impossible de charger vos messages</Text>
        <Text style={styles.errorBody}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => load()}><Text style={styles.retryButtonText}>Réessayer</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={
      <ScrollView>
        <View style={{ flex: 1 }} />
      </ScrollView>
    }>
      <Text style={styles.header}>Messages</Text>
      {conversation ? (
        <TouchableOpacity style={styles.conversationCard} onPress={() => onNavigate?.('conversationDetail')} activeOpacity={0.7}>
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{conversation.patientName}</Text>
              <Text style={styles.cardSummary}>{conversation.patientSummary}</Text>
              <Text style={styles.cardPreview}>{conversation.messages[conversation.messages.length - 1]?.text || 'Aucun message'}</Text>
            </View>
            <View style={styles.cardMeta}>
              {conversation.unreadCount > 0 && (
                <View style={styles.unreadBadge}><Text style={styles.unreadText}>{conversation.unreadCount}</Text></View>
              )}
              <Text style={styles.cardTime}>{new Date(conversation.updatedAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <Text style={styles.empty}>Aucune conversation pour le moment.</Text>
      )}

      {/* Open tasks from care requests */}
      {hasOpenTasks && (
        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>À faire</Text>
          {openTasks.map((task) => (
            <TouchableOpacity key={task.id} style={styles.taskRow} onPress={() => onNavigate?.('education')} activeOpacity={0.7}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDesc}>{task.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

function createStyles(colors: any) {
  return {
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  header: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background },
  conversationCard: { backgroundColor: colors.primaryForeground, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: colors.foreground, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: colors.primary },
  cardSummary: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  cardPreview: { fontSize: 14, color: colors.foreground, marginTop: 4 },
  cardMeta: { alignItems: 'flex-end', marginLeft: 8 },
  unreadBadge: { backgroundColor: colors.primary, borderRadius: 12, minWidth: 22, paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  unreadText: { color: colors.primaryForeground, fontSize: 11, fontWeight: '700' },
  cardTime: { fontSize: 11, color: colors.mutedForeground },
  tasksSection: { marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.primary, marginBottom: 8 },
  taskRow: { backgroundColor: colors.primaryForeground, borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitle: { fontSize: 14, fontWeight: '600', color: colors.primary },
  taskDesc: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  empty: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', padding: 16 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 8, textAlign: 'center' },
  errorBody: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, minHeight: 44, justifyContent: 'center' },
  retryButtonText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
}
}

export default PatientMessagesScreen;