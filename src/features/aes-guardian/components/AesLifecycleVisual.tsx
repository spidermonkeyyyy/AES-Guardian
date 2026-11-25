import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../../../components/AppText';
import { AppIcon } from '../../../components/AppIcon';
import { useTheme } from '../../../theme/ThemeContext';
import { aesRadii, aesSpacing } from '../../../theme/tokens';
import {
  getLayoutRowDirection,
  getLayoutTextAlign,
  t,
  useLocale,
  useLayoutDirection,
} from '../../../localization';
import { AesCard } from './AesCard';

interface StatusNodeProps {
  label: string;
  testID: string;
}

function StatusNode({ label, testID }: StatusNodeProps) {
  const { colors } = useTheme();
  const direction = useLayoutDirection();
  const textAlign = getLayoutTextAlign(direction);

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      testID={testID}
      style={[
        styles.statusNode,
        {
          backgroundColor: colors.secondary,
          borderColor: colors.primary,
        },
      ]}
    >
      <AppText variant="caption" style={[styles.statusText, { color: colors.foreground, textAlign }]}>
        {label}
      </AppText>
    </View>
  );
}

function Arrow() {
  const { colors } = useTheme();
  return (
    <View style={styles.arrow} pointerEvents="none">
      <AppIcon name="forward-chevron" size={16} color={colors.mutedForeground} decorative />
    </View>
  );
}

export const AesLifecycleVisual: React.FC = () => {
  const { colors } = useTheme();
  const locale = useLocale();
  const direction = useLayoutDirection();
  const rowDirection = getLayoutRowDirection(direction);
  const textAlign = getLayoutTextAlign(direction);

  return (
    <AesCard
      elevated={false}
      testID="aes-lifecycle-visual"
      style={styles.container}
      accessibilityLabel={t('help.lifecycle.title', locale)}
    >
      <AppText
        variant="card"
        style={[styles.title, { color: colors.foreground, textAlign }]}
      >
        {t('help.lifecycle.title', locale)}
      </AppText>
      <AppText
        variant="caption"
        tone="muted"
        style={[styles.notLinear, { textAlign }]}
      >
        {t('help.lifecycle.notLinear', locale)}
      </AppText>

      <AesCard elevated={false} testID="aes-lifecycle-declaration" style={styles.processCard}>
        <View style={[styles.processHeader, { flexDirection: rowDirection }]}>
          <AppIcon name="clipboard-list" size={18} color={colors.primary} decorative />
          <AppText variant="subheading" style={[styles.processTitle, { color: colors.foreground, textAlign }]}>
            {t('help.lifecycle.declaration', locale)}
          </AppText>
        </View>

        <View style={[styles.flowRow, { flexDirection: rowDirection }]}>
          <StatusNode label={t('status.draft', locale)} testID="aes-lifecycle-status-draft" />
          <Arrow />
          <StatusNode label={t('status.submitted', locale)} testID="aes-lifecycle-status-submitted" />
        </View>

        <View style={[styles.branchLabelRow, { flexDirection: rowDirection }]}>
          <AppText variant="caption" tone="muted" style={[styles.branchLabel, { textAlign }]}>
            {t('help.lifecycle.conditionalBranch', locale)}
          </AppText>
        </View>

        <View style={[styles.flowRow, { flexDirection: rowDirection }]}>
          <StatusNode label={t('status.under_review', locale)} testID="aes-lifecycle-status-under-review" />
          <Arrow />
          <StatusNode label={t('status.correction_requested', locale)} testID="aes-lifecycle-status-correction" />
          <Arrow />
          <StatusNode label={t('status.resubmitted', locale)} testID="aes-lifecycle-status-resubmitted" />
        </View>

        <View style={[styles.flowRow, { flexDirection: rowDirection }]}>
          <StatusNode label={t('status.resubmitted', locale)} testID="aes-lifecycle-status-resubmitted-return" />
          <Arrow />
          <StatusNode label={t('status.under_review', locale)} testID="aes-lifecycle-status-under-review-return" />
        </View>

        <View style={[styles.closedRow, { flexDirection: rowDirection }]}>
          <View style={[styles.branchLine, { backgroundColor: colors.border }]} />
          <StatusNode label={t('status.closed', locale)} testID="aes-lifecycle-status-closed" />
          <AppText variant="caption" tone="muted" style={[styles.closedLabel, { textAlign }]}>
            {t('help.lifecycle.closedNoTransition', locale)}
          </AppText>
        </View>
      </AesCard>

      <AesCard elevated={false} testID="aes-lifecycle-oh" style={styles.processCard}>
        <View style={[styles.processHeader, { flexDirection: rowDirection }]}>
          <AppIcon name="stethoscope" size={18} color={colors.primary} decorative />
          <View style={styles.processHeaderText}>
            <AppText variant="subheading" style={[styles.processTitle, { color: colors.foreground, textAlign }]}>
              {t('help.lifecycle.oh', locale)}
            </AppText>
            <AppText variant="caption" tone="muted" style={{ textAlign }}>
              {t('help.lifecycle.optionalIfApplicable', locale)}
            </AppText>
          </View>
        </View>
        <View style={[styles.flowRow, { flexDirection: rowDirection }]}>
          <StatusNode label={t('oh.status.pending_acknowledgement', locale)} testID="aes-lifecycle-oh-pending" />
          <Arrow />
          <StatusNode label={t('oh.status.acknowledged', locale)} testID="aes-lifecycle-oh-acknowledged" />
          <Arrow />
          <StatusNode label={t('oh.status.completed', locale)} testID="aes-lifecycle-oh-completed" />
        </View>
        <View style={[styles.cancelledRow, { flexDirection: rowDirection }]}>
          <StatusNode label={t('oh.status.cancelled', locale)} testID="aes-lifecycle-oh-cancelled" />
        </View>
      </AesCard>

      <AesCard elevated={false} testID="aes-lifecycle-capa" style={styles.processCard}>
        <View style={[styles.processHeader, { flexDirection: rowDirection }]}>
          <AppIcon name="shield-check" size={18} color={colors.primary} decorative />
          <View style={styles.processHeaderText}>
            <AppText variant="subheading" style={[styles.processTitle, { color: colors.foreground, textAlign }]}>
              {t('help.lifecycle.capa', locale)}
            </AppText>
            <AppText variant="caption" tone="muted" style={{ textAlign }}>
              {t('help.lifecycle.independent', locale)}
            </AppText>
          </View>
        </View>
        <View style={[styles.flowRow, { flexDirection: rowDirection }]}>
          <StatusNode label={t('prevention.overview.proposed', locale)} testID="aes-lifecycle-capa-proposed" />
          <Arrow />
          <StatusNode label={t('prevention.overview.in_progress', locale)} testID="aes-lifecycle-capa-in-progress" />
          <Arrow />
          <StatusNode label={t('prevention.overview.completed', locale)} testID="aes-lifecycle-capa-completed" />
        </View>
        <View style={[styles.cancelledRow, { flexDirection: rowDirection }]}>
          <StatusNode label={t('prevention.overview.cancelled', locale)} testID="aes-lifecycle-capa-cancelled" />
        </View>
      </AesCard>
    </AesCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: aesSpacing.sm,
  },
  title: {
    fontWeight: '700',
  },
  notLinear: {
    marginTop: aesSpacing.xs,
  },
  processCard: {
    marginTop: aesSpacing.sm,
  },
  processHeader: {
    alignItems: 'center',
    gap: aesSpacing.sm,
  },
  processHeaderText: {
    flex: 1,
  },
  processTitle: {
    flex: 1,
    fontWeight: '600',
  },
  branchLabelRow: {
    marginTop: aesSpacing.sm,
  },
  branchLabel: {
    fontWeight: '600',
  },
  flowRow: {
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: aesSpacing.xs,
    marginTop: aesSpacing.sm,
  },
  arrow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusNode: {
    borderRadius: aesRadii.pill,
    borderWidth: 1,
    maxWidth: '100%',
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: aesSpacing.sm,
    paddingVertical: aesSpacing.xs,
  },
  statusText: {
    fontWeight: '600',
  },
  closedRow: {
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: aesSpacing.xs,
    marginTop: aesSpacing.sm,
  },
  branchLine: {
    height: 1,
    width: aesSpacing.lg,
  },
  closedLabel: {
    flexShrink: 1,
  },
  cancelledRow: {
    marginTop: aesSpacing.sm,
  },
});
