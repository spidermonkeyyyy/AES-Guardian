/**
 * AES Guardian — Declaration List Screen
 *
 * Phase 2E.1.4.3 — Batch 4
 *
 * Role-guarded declaration list for exposed_professional and admin_reviewer.
 * Provides 5 filter chips mapping to real persisted DeclarationStatus values.
 * NOTE: The blueprint "Validées" filter is intentionally replaced by "Clôturées" (→ closed),
 * because `validated` is not a persisted DeclarationStatus value in the AES Guardian schema.
 *
 * Access matrix:
 *   exposed_professional — sees own declarations only (getDeclarations scoped to userId)
 *   admin_reviewer       — sees all declarations, plus Review Queue shortcut
 *   oh_professional, quality_staff, tech_admin — blocked entirely (RestrictedState rendered)
 *
 * Authorisation is enforced at the repository layer (Phase 2E.1.4.2A).
 * UI role guard is an additional informational barrier only.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { aesSpacing, aesTypography, aesRadii } from '../../../theme/tokens';
import {
  getDatabase,
  AesDeclaration,
  DeclarationStatus,
  useDemoRoleStore,
} from '../../../core';
import { t, useLocale } from '../../../localization';
import { AesScreenContainer, AesScreenHeader, AesStatusBadge } from '../components';
import { useTheme } from '../../../theme/ThemeContext';
import { AppIcon } from '../../../components/AppIcon';
import AppText from '../../../components/AppText';
// ─── Types ───────────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'draft' | 'submitted' | 'under_review' | 'closed';

const PERMITTED_ROLES = ['exposed_professional', 'admin_reviewer'] as const;

// ─── Filter chip definitions ──────────────────────────────────────────────────

function getFilterChips(): { key: FilterKey; labelKey: string }[] {
  return [
    { key: 'all', labelKey: 'list.filter.all' },
    { key: 'draft', labelKey: 'list.filter.draft' },
    { key: 'submitted', labelKey: 'list.filter.submitted' },
    { key: 'under_review', labelKey: 'list.filter.under_review' },
    // "Clôturées" replaces blueprint "Validées": `validated` is not a persisted status.
    { key: 'closed', labelKey: 'list.filter.closed' },
  ];
}

// ─── Client-side filter predicate ────────────────────────────────────────────

function matchesFilter(decl: AesDeclaration, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  // "En révision" shows both under_review and resubmitted declarations
  if (filter === 'under_review') {
    return decl.status === 'under_review' || decl.status === 'resubmitted';
  }
  return decl.status === (filter as DeclarationStatus);
}

// ─── Component ───────────────────────────────────────────────────────────────

export const DeclarationListScreen: React.FC = () => {
  const { colors } = useTheme();
  const locale = useLocale();
  const styles = createStyles(colors);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const isFocused = useIsFocused();
  const { activeContext } = useDemoRoleStore();
  const { role, userId } = activeContext;

  const [declarations, setDeclarations] = useState<AesDeclaration[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPermitted = (PERMITTED_ROLES as readonly string[]).includes(role);

  // ─── Load ─────────────────────────────────────────────────────────────────

  const loadDeclarations = useCallback(async () => {
    if (!isPermitted) return;
    setLoading(true);
    setError(null);
    try {
      const db = getDatabase();
      const result = await db.getDeclarations({ requestingUserId: userId });
      setDeclarations(result);
    } catch (e: any) {
      setError(e?.message ?? t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [userId, role, isPermitted]);

  // Reset filter and reload when identity changes
  useEffect(() => {
    setDeclarations([]);
    setActiveFilter('all');
    loadDeclarations();
  }, [userId, role]);

  // Reload on screen focus
  useEffect(() => {
    if (isFocused) {
      loadDeclarations();
    }
  }, [isFocused]);

  // ─── Derived filtered list ────────────────────────────────────────────────

  const filteredDeclarations = declarations.filter((d) => matchesFilter(d, activeFilter));

  // ─── Restricted state ─────────────────────────────────────────────────────

  if (!isPermitted) {
    return (
      <AesScreenContainer testID="declaration-list-screen">
        <AesScreenHeader title={t('list.restrictedTitle')} />
        <View style={styles.centeredState}>
          <AppText style={[styles.restrictedText, { color: colors.mutedForeground }]}>
            {t('list.restrictedMessage')}
          </AppText>
        </View>
      </AesScreenContainer>
    );
  }

  // ─── Title and role-specific actions ─────────────────────────────────────

  const listTitle =
    role === 'admin_reviewer' ? t('list.title.admin') : t('list.title');

  const headerRightElement =
    role === 'admin_reviewer' ? (
      <TouchableOpacity
        onPress={() => navigation.navigate('adminReviewQueue')}
        style={styles.queueButton}
        accessibilityRole="button"
        accessibilityLabel={t('list.adminQueueShortcut')}
        testID="admin-queue-shortcut"
      >
        <AppText style={[styles.queueButtonText, { color: colors.primary }]}>
          {t('list.adminQueueShortcut')}
        </AppText>
      </TouchableOpacity>
    ) : undefined;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AesScreenContainer testID="declaration-list-screen">
      <AesScreenHeader title={listTitle} rightElement={headerRightElement} />

      {/* Filter chip bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipBar}
        contentContainerStyle={[
          styles.chipBarContent,
          { flexDirection: locale === 'ar' ? 'row-reverse' : 'row' },
        ]}
        testID="filter-chip-bar"
      >
        {getFilterChips().map((chip) => {
          const isActive = activeFilter === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              onPress={() => setActiveFilter(chip.key)}
              style={[
                styles.chip,
                isActive ? styles.chipActive : styles.chipInactive,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t(chip.labelKey as any)}
              accessibilityState={{ selected: isActive }}
              testID={`filter-chip-${chip.key}`}
            >
              <AppText
                style={[
                  styles.chipText,
                  { color: isActive ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {t(chip.labelKey as any)}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centeredState}>
          <AppText style={[styles.errorText, { color: colors.foreground }]}>{error}</AppText>
        </View>
      ) : (
        <FlatList
          data={filteredDeclarations}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={
            filteredDeclarations.length === 0
              ? styles.emptyContent
              : styles.listContent
          }
          testID="declaration-list"
          ListEmptyComponent={
            <View style={styles.centeredState}>
              <AppText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t('list.empty')}
              </AppText>
            </View>
          }
          ListFooterComponent={
            role === 'exposed_professional' ? (
              <TouchableOpacity
                style={styles.newButton}
                onPress={() => navigation.navigate('newDeclaration')}
                accessibilityRole="button"
                accessibilityLabel={t('list.newButton')}
                testID="new-declaration-button"
              >
                <View
                  style={[
                    styles.newButtonContent,
                    { flexDirection: locale === 'ar' ? 'row-reverse' : 'row' },
                  ]}
                >
                  <AppIcon name="add" size={20} color={colors.primaryForeground} />
                  <AppText style={styles.newButtonText}>{t('list.newButton')}</AppText>
                </View>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card }]}
              onPress={() =>
                navigation.navigate('declarationDetails', { declarationId: item.id })
              }
              accessibilityRole="button"
              accessibilityLabel={`${t('list.refNumber')} ${item.reference_number}`}
              testID={`declaration-card-${item.id}`}
            >
              <View
                style={[
                  styles.cardHeader,
                  { flexDirection: locale === 'ar' ? 'row-reverse' : 'row' },
                ]}
                testID={`declaration-card-header-${item.id}`}
              >
                <AppText
                  style={[styles.referenceText, { color: colors.foreground }]}
                  testID={`declaration-reference-${item.id}`}
                >
                  {item.reference_number || t('list.refUnavailable')}
                </AppText>
                <AesStatusBadge
                  status={item.status}
                  domain="declaration"
                  testID={`declaration-status-${item.id}`}
                />
              </View>
              {item.incident_date ? (
                <AppText
                  style={[styles.cardMeta, { color: colors.mutedForeground }]}
                  testID={`declaration-date-${item.id}`}
                >
                  {`${t('list.incidentDate')}: ${item.incident_date}`}
                </AppText>
              ) : null}
              {item.incident_type ? (
                <AppText
                  style={[styles.cardMeta, { color: colors.mutedForeground }]}
                  testID={`declaration-type-${item.id}`}
                >
                  {`${t('list.incidentType')}: ${(t as any)(`form.incidentType.${item.incident_type.replace('_exposure', '')}`) ?? item.incident_type}`}
                </AppText>
              ) : null}
              {item.circumstances ? (
                <AppText
                  style={[styles.cardCircumstances, { color: colors.foreground }]}
                >
                  {item.circumstances}
                </AppText>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}
    </AesScreenContainer>
  );
};

export default DeclarationListScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  chipBar: {
    flexGrow: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  chipBarContent: {
    flexDirection: 'row',
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingVertical: aesSpacing.sm,
    gap: aesSpacing.xs,
  },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: aesRadii.pill,
    paddingHorizontal: aesSpacing.md,
    paddingVertical: aesSpacing.xs,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  chipText: {
    ...aesTypography.labelSmall,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: aesSpacing.sm,
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingBottom: aesSpacing['2xl'],
    gap: aesSpacing.sm,
  },
  emptyContent: {
    flex: 1,
    paddingHorizontal: aesSpacing.screenHorizontal,
  },
  card: {
    padding: aesSpacing.cardPadding,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: aesSpacing.xs,
  },
  referenceText: {
    ...aesTypography.heading2,
    flex: 1,
    marginEnd: aesSpacing.sm,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  cardMeta: {
    ...aesTypography.bodySmall,
    marginTop: 2,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  cardCircumstances: {
    ...aesTypography.bodySmall,
    marginTop: aesSpacing.xs,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: aesSpacing.xl,
  },
  emptyText: {
    ...aesTypography.body,
    textAlign: 'center',
  },
  restrictedText: {
    ...aesTypography.body,
    textAlign: 'center',
  },
  errorText: {
    ...aesTypography.body,
    textAlign: 'center',
  },
  newButton: {
    marginTop: aesSpacing.md,
    marginBottom: aesSpacing['2xl'],
    padding: aesSpacing.md,
    borderRadius: aesRadii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  newButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: aesSpacing.xs,
  },
  newButtonText: {
    color: colors.primaryForeground,
    ...aesTypography.body,
    fontWeight: '600',
  },
  queueButton: {
    paddingHorizontal: aesSpacing.sm,
    paddingVertical: aesSpacing.xs,
  },
  queueButtonText: {
    ...aesTypography.labelSmall,
    fontWeight: '600',
  },
  });
}
