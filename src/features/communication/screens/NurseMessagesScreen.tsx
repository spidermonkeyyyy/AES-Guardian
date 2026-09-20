import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { AppHeader, AppCard, RespiBadge } from '../../../components';
import { useTheme } from '../../../theme/ThemeContext';

interface ConversationItem {
  id: string;
  patientName: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  priority: 'high' | 'medium' | 'normal';
}

const mockConversations: ConversationItem[] = [
  {
    id: '1',
    patientName: 'Jean Dupont',
    lastMessage: 'J\'ai eu une légère toux ce matin mais ça va mieux.',
    timestamp: '09:42',
    unreadCount: 1,
    priority: 'high',
  },
  {
    id: '2',
    patientName: 'Marie Curie',
    lastMessage: 'Mon taux SpO2 est remonté à 97% après les exercices.',
    timestamp: 'Hier',
    unreadCount: 0,
    priority: 'normal',
  },
  {
    id: '3',
    patientName: 'Ahmed Benali',
    lastMessage: 'Est-ce que je peux décaler la prise de Spiriva ?',
    timestamp: '15 Sept',
    unreadCount: 0,
    priority: 'medium',
  },
];

export default function NurseMessagesScreen({ navigation }: any) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Messages Patients" />
      <FlatList
        data={mockConversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.7} onPress={() => {
  const { colors } = useTheme();}}>
            <AppCard variant="outlined" style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {item.patientName.split(' ').map((n) => n[0]).join('')}
                  </Text>
                </View>

                <View style={styles.content}>
                  <View style={styles.topLine}>
                    <Text style={[styles.name, { color: colors.foreground }]}>{item.patientName}</Text>
                    <Text style={[styles.time, { color: colors.mutedForeground }]}>{item.timestamp}</Text>
                  </View>
                  <Text style={[styles.lastMsg, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                </View>

                {item.unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </AppCard>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.sm },
  card: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  content: { flex: 1 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  name: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  time: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
  },
  lastMsg: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
});
