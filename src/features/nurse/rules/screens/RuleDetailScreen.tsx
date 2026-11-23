import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRuleStore } from '../state/use-rule-store';
import { useTheme } from '../../../../theme/ThemeContext';
import { MonitoringRule, RuleCondition } from '../../../../types/rule';
import { NurseTabParamList } from '../../../../navigation/routes';
import { spacing, typography, shapes } from '../../../../theme/tokens';
import { isRTL, t, useLocale } from '../../../../localization';

type RuleDetailNavigation = NativeStackNavigationProp<NurseTabParamList, 'ruleDetail'>;

export default function RuleDetailScreen() {
  const { colors } = useTheme();
  const locale = useLocale();
  const rtl = isRTL(locale);
  const styles = createStyles(colors);
  const route = useRoute();
  const navigation = useNavigation<RuleDetailNavigation>();
  const ruleId = (route.params as any)?.ruleId as string | undefined;
  const ruleById = useRuleStore((s) => s.ruleById);
  const updateRule = useRuleStore((s) => s.updateRule);
  const setShowEnabledOnly = useRuleStore((s) => s.setShowEnabledOnly);

  const rule = ruleId ? ruleById(ruleId) : undefined;

  useFocusEffect(
    useCallback(() => {
      setShowEnabledOnly(false);
    }, [setShowEnabledOnly]),
  );

  if (!rule) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.notFoundText, { textAlign: rtl ? 'right' : 'left' }]}>{t('nurse.rules.detailNotFound', locale)}</Text>
      </View>
    );
  }

  const handleEdit = () => {
    navigation.navigate('ruleBuilder', { ruleId: rule.id });
  };

  const handleToggleEnabled = () => {
    updateRule({ ...rule, enabled: !rule.enabled });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.titleRow}>
          <Text style={styles.ruleName}>{rule.name}</Text>
          <TouchableOpacity
            style={[styles.enabledBadge, rule.enabled ? styles.enabledBadgeOn : styles.enabledBadgeOff]}
            onPress={handleToggleEnabled}
            accessibilityRole="button"
            accessibilityLabel={rule.enabled ? 'Désactiver la règle' : 'Activer la règle'}
          >
            <Text style={[styles.enabledBadgeText, rule.enabled ? styles.enabledBadgeTextOn : styles.enabledBadgeTextOff]}>
              {rule.enabled ? 'Activée' : 'Désactivée'}
            </Text>
          </TouchableOpacity>
        </View>

        {rule.description ? (
          <Text style={styles.ruleDescription}>{rule.description}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{t('nurse.rules.priority', locale)}: {rule.priority}</Text>
          <Text style={styles.metaText}>
            {t(rule.enabled ? 'nurse.rules.active' : 'nurse.rules.inactive', locale)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('nurse.rules.condition', locale)}</Text>
        <View style={styles.card}>
          <View style={styles.groupBlock}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupBadge, rule.conditionGroup.mode === 'all' ? styles.groupBadgeAnd : styles.groupBadgeOr]}>
                <Text style={styles.groupBadgeText}>
                  {rule.conditionGroup.mode === 'all' ? 'ET' : 'OU'}
                </Text>
              </View>
              <Text style={styles.groupLabel}>
                {rule.conditionGroup.conditions.length} condition{rule.conditionGroup.conditions.length > 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.conditionsList}>
              {rule.conditionGroup.conditions.map((condition) => (
                <ConditionRow key={condition.id} condition={condition} styles={styles} />
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('nurse.rules.actionSection', locale)}</Text>
        <View style={styles.card}>
          <View style={styles.actionRow}>
            <Text style={styles.actionLabel}>
              {rule.action === 'create_alert'
                ? (locale === 'ar' ? 'إنشاء تنبيه' : locale === 'en' ? 'Create alert' : 'Créer une alerte')
                : (locale === 'ar' ? 'إحالته للمراجعة' : locale === 'en' ? 'Flag for review' : 'Signaler pour revue')}
            </Text>
            <View style={[styles.actionPriorityBadge, rule.priority === 'high' ? styles.actionPriorityHigh : styles.actionPriorityMedium]}>
              <Text style={styles.actionPriorityText}>
                {rule.priority === 'high' ? 'Haute' : rule.priority === 'medium' ? 'Moyenne' : 'Basse'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={handleEdit}
        accessibilityRole="button"
        accessibilityLabel="Modifier la règle"
      >
        <Text style={styles.editButtonText}>Modifier</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

interface ConditionRowProps {
  condition: RuleCondition;
}

function ConditionRow({ condition, styles }: ConditionRowProps & { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.conditionRow}>
      <View style={styles.conditionHeader}>
        <Text style={styles.conditionField}>{condition.metricLabel}</Text>
        <View style={styles.conditionOperatorBadge}>
          <Text style={styles.conditionOperatorText}>{condition.operator}</Text>
        </View>
      </View>
      <Text style={styles.conditionValue}>
        {condition.value}{condition.unit ? ` ${condition.unit}` : ''}
      </Text>
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  notFoundText: {
    fontSize: typography.fontSize.md,
    color: colors.mutedForeground,
  },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: shapes.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    margin: spacing[3],
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  ruleName: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.foreground,
    marginRight: spacing[2],
  },
  enabledBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: shapes.sm,
  },
  enabledBadgeOn: {
    backgroundColor: colors.success + '20',
  },
  enabledBadgeOff: {
    backgroundColor: colors.muted,
  },
  enabledBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  enabledBadgeTextOn: {
    color: colors.success,
  },
  enabledBadgeTextOff: {
    color: colors.mutedForeground,
  },
  ruleDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    marginBottom: spacing[2],
    lineHeight: typography.lineHeight.normal,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
  },
  section: {
    marginHorizontal: spacing[3],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: shapes.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
  },
  groupBlock: {
    marginBottom: spacing[3],
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  groupBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: shapes.sm,
    marginRight: spacing[2],
  },
  groupBadgeAnd: {
    backgroundColor: colors.primary + '20',
  },
  groupBadgeOr: {
    backgroundColor: colors.warning + '20',
  },
  groupBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.foreground,
  },
  groupLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
  },
  conditionsList: {
    gap: spacing[2],
  },
  conditionRow: {
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  conditionField: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.foreground,
    marginRight: spacing[2],
  },
  conditionOperatorBadge: {
    backgroundColor: colors.muted,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: shapes.sm,
  },
  conditionOperatorText: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.medium,
  },
  conditionValue: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.foreground,
  },
  actionPriorityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: shapes.sm,
  },
  actionPriorityHigh: {
    backgroundColor: colors.destructive + '20',
  },
  actionPriorityMedium: {
    backgroundColor: colors.warning + '20',
  },
  actionPriorityText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.foreground,
  },
  editButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing[3],
    borderRadius: shapes.sm,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing[3],
    marginBottom: spacing[6],
  },
  editButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});
}
