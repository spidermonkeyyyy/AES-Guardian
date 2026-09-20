import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { AppCard, RespiBadge, AppHeader } from '../../../components';
import { useNurseDashboardStore } from '../dashboard/state/use-nurse-dashboard-store';
import { useAuthStore } from '../../authentication/hooks/use-auth-store';
import { NurseWorklistFilter } from '../../../types/dashboard';
import { useTheme } from '../../../theme/ThemeContext';

export default function NurseDashboardScreen({ navigation }: any) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const {
    isLoading,
    summary,
    priorityQueue,
    worklistItems,
    worklistFilter,
    loadDashboard,
    setWorklistFilter,
  } = useNurseDashboardStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const filteredItems = worklistItems.filter((item) => {
    if (worklistFilter === 'all') return true;
    if (worklistFilter === 'alerts') return item.type === 'alert';
    if (worklistFilter === 'tasks') return item.type === 'task';
    if (worklistFilter === 'monitoring') return item.type === 'monitoring';
    if (worklistFilter === 'needsAttention') return item.isActionable;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Espace Infirmier"
        subtitle={`Connecté : ${user?.name || 'Sarah Benali'}`}
        rightAction={
          <TouchableOpacity
            style={[styles.ruleButton, { backgroundColor: colors.secondary }]}
            onPress={() => navigation.navigate('rules')}
          >
            <Icon name="sliders" size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* 1. Nurse Greeting */}
        <View style={styles.greetingRow}>
          <Text style={[styles.greetingText, { color: colors.foreground }]}>Bonjour, {user?.name || 'Sarah'} 👋</Text>
          <Text style={[styles.subGreetingText, { color: colors.mutedForeground }]}>Tableau de tri opérationnel et file de travail</Text>
        </View>

        {/* 2. Attention Summary */}
        <AppCard variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryTitleRow}>
              <Icon name="bell" size={20} color={colors.warning} />
              <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Attention requise</Text>
            </View>
            <RespiBadge label={`${summary?.reviewRequiredCount || 3} à traiter`} variant="warning" />
          </View>
          <View style={styles.categoriesRow}>
            <TouchableOpacity
              style={[
                styles.categoryBox,
                { backgroundColor: colors.surfaceVariant },
                worklistFilter === 'alerts' && { borderColor: colors.primary, backgroundColor: colors.secondary },
              ]}
              onPress={() => setWorklistFilter('alerts')}
            >
              <Text style={[styles.categoryCount, { color: colors.foreground }]}>{summary?.highPriorityCount || 2}</Text>
              <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>Alertes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.categoryBox,
                { backgroundColor: colors.surfaceVariant },
                worklistFilter === 'tasks' && { borderColor: colors.primary, backgroundColor: colors.secondary },
              ]}
              onPress={() => setWorklistFilter('tasks')}
            >
              <Text style={[styles.categoryCount, { color: colors.foreground }]}>{summary?.newSubmissionsCount || 1}</Text>
              <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>Tâches</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.categoryBox,
                { backgroundColor: colors.surfaceVariant },
                worklistFilter === 'monitoring' && { borderColor: colors.primary, backgroundColor: colors.secondary },
              ]}
              onPress={() => setWorklistFilter('monitoring')}
            >
              <Text style={[styles.categoryCount, { color: colors.foreground }]}>{summary?.reviewRequiredCount || 4}</Text>
              <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>Suivis</Text>
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* 3. Clinical Worklist */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>File de travail</Text>
          <View style={styles.filterChipsRow}>
            {(['all', 'alerts', 'tasks', 'monitoring'] as const).map((filter: NurseWorklistFilter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.surfaceVariant },
                  worklistFilter === filter && { backgroundColor: colors.primary },
                ]}
                onPress={() => setWorklistFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: colors.mutedForeground },
                    worklistFilter === filter && { color: colors.primaryForeground, fontWeight: typography.fontWeight.semibold },
                  ]}
                >
                  {filter === 'all' ? 'Tous' : filter === 'alerts' ? 'Alertes' : filter === 'tasks' ? 'Tâches' : 'Suivis'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : filteredItems.length === 0 ? (
          <AppCard variant="flat" style={styles.emptyCard}>
            <Icon name="check-circle" size={32} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Vous êtes à jour</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Aucun élément ne nécessite votre attention pour ce filtre.</Text>
          </AppCard>
        ) : (
          filteredItems.map((item, idx) => (
            <AppCard
              key={item.id || idx}
              variant="outlined"
              style={styles.workItemCard}
              onPress={() => {
                if (item.patientId) {
                  navigation.navigate('patients', {
                    screen: 'patientDetail',
                    params: { patientId: item.patientId },
                  });
                }
              }}
            >
              <View style={styles.workItemHeader}>
                <View style={styles.patientInfoRow}>
                  <Text style={[styles.patientName, { color: colors.foreground }]}>{item.patientName || 'Patient'}</Text>
                  <Text style={[styles.itemTime, { color: colors.mutedForeground }]}>{item.timestamp || '10 min'}</Text>
                </View>
                <RespiBadge
                  label={item.statusLabel || 'En attente'}
                  variant={item.priorityRank === 1 ? 'danger' : 'info'}
                />
              </View>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.title}</Text>
              {item.description ? <Text style={[styles.itemSubtitle, { color: colors.mutedForeground }]}>{item.description}</Text> : null}
            </AppCard>
          ))
        )}

        {/* 4. Priority Roster Quick Access */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Patients prioritaires</Text>
          <TouchableOpacity onPress={() => navigation.navigate('patients')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>Voir tous →</Text>
          </TouchableOpacity>
        </View>

        {priorityQueue.slice(0, 3).map((patient, idx) => (
          <AppCard
            key={patient.patientId || idx}
            variant="outlined"
            style={styles.rosterCard}
            onPress={() =>
              navigation.navigate('patients', {
                screen: 'patientDetail',
                params: { patientId: patient.patientId },
              })
            }
          >
            <View style={styles.rosterRow}>
              <View style={[styles.rosterAvatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.rosterAvatarText, { color: colors.primaryForeground }]}>
                  {patient.patientName?.substring(0, 2).toUpperCase() || 'PT'}
                </Text>
              </View>
              <View style={styles.rosterInfo}>
                <Text style={[styles.rosterName, { color: colors.foreground }]}>{patient.patientName}</Text>
                <Text style={[styles.rosterCondition, { color: colors.mutedForeground }]}>{patient.condition || 'BPCO Sévère'}</Text>
              </View>
              <RespiBadge
                label={patient.hasNewSubmission ? 'Nouveau suivi' : 'Stable'}
                variant={patient.hasNewSubmission ? 'warning' : 'success'}
              />
            </View>
          </AppCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.screenPadding, gap: spacing.md },
  ruleButton: {
    padding: spacing.xs,
    borderRadius: shapes.sm,
  },
  greetingRow: {
    marginTop: spacing.xs,
  },
  greetingText: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  subGreetingText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  summaryCard: {
    padding: spacing.cardPadding,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryTitle: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  categoryBox: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: shapes.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryCount: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  categoryLabel: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  seeAllText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: shapes.pill,
  },
  filterChipText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  workItemCard: {
    padding: spacing.md,
  },
  workItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  patientInfoRow: {
    flex: 1,
  },
  patientName: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  itemTime: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
  },
  itemTitle: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xxs,
  },
  itemSubtitle: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  rosterCard: {
    padding: spacing.md,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rosterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterAvatarText: {
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
  },
  rosterInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  rosterName: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  rosterCondition: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
  },
});
