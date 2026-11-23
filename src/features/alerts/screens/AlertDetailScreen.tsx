import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert as RNAlert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAlertStore } from '../state/use-alert-store';
import {
  Alert,
  AlertStatus,
  AlertPriority,
  NurseAction,
  NurseDecision,
  doesNurseDecisionRequireJustification,
  doesNurseActionRequireNote,
} from '../../../types/alert';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing, typography, shapes } from '../../../theme/tokens';

interface AlertDetailScreenProps {
  alertId: string;
}

function createStyles(colors: any) {
  return {
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
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.md,
    color: colors.mutedForeground,
  },
  errorTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: typography.fontSize.md,
    color: colors.mutedForeground,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: shapes.sm,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: shapes.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    margin: spacing[3],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  patientInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
  patientName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  patientSummary: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
  },
  priorityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: shapes.sm,
  },
  priorityText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  reasonText: {
    fontSize: typography.fontSize.md,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: shapes.sm,
    backgroundColor: colors.muted,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.medium,
  },
  timestampText: {
    fontSize: typography.fontSize.xs,
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
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: shapes.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    marginBottom: spacing[2],
  },
  rulesList: {
    gap: spacing[2],
  },
  ruleItem: {
    marginBottom: spacing[2],
  },
  ruleName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  criteriaList: {
    gap: spacing[1],
  },
  criterionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  criterionBullet: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    width: 16,
  },
  criterionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
  },
  noCriteriaText: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    fontStyle: 'italic',
  },
  noMeasurementsText: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    fontStyle: 'italic',
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  measurementCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.muted,
    borderRadius: shapes.sm,
    padding: spacing[2],
  },
  measurementLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
  },
  measurementValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  measurementReference: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
  },
  measurementTrend: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  siblingsCard: {
    backgroundColor: colors.card,
    borderRadius: shapes.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  siblingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  siblingInfo: {
    flex: 1,
  },
  siblingReason: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  siblingMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
  },
  siblingSelected: {
    width: 4,
    height: '100%',
    backgroundColor: colors.primary,
  },
  actionPanel: {
    backgroundColor: colors.muted,
    borderRadius: shapes.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
  },
  actionPanelTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing[3],
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.foreground,
    marginBottom: spacing[1],
    marginTop: spacing[2],
  },
  fieldHint: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
  },
  field: {
    marginBottom: spacing[2],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  chip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: shapes.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: {
    backgroundColor: colors.primary + '30',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: shapes.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    minHeight: 80,
    justifyContent: 'center',
  },
  inputPlaceholder: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing[3],
    borderRadius: shapes.sm,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[3],
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  outlinedButton: {
    backgroundColor: colors.card,
    paddingVertical: spacing[3],
    borderRadius: shapes.sm,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlinedButtonText: {
    color: colors.foreground,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resolvedCard: {
    backgroundColor: colors.success + '10',
    borderRadius: shapes.md,
    borderWidth: 1,
    borderColor: colors.success + '40',
    padding: spacing[3],
  },
  resolvedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  resolvedIcon: {
    fontSize: 20,
    color: colors.success,
    marginRight: spacing[2],
  },
  resolvedTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  resolvedDecision: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  resolvedNote: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  resolvedJustification: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  resolvedResolution: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
  },
}
}



