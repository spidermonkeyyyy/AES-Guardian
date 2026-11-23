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
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { aesColors, aesSpacing, aesTypography, aesRadii } from '../../../theme/tokens';
import {
  getDatabase,
  AesDeclaration,
  DeclarationStatus,
  useDemoRoleStore,
} from '../../../core';
import { t } from '../../../localization';
import { AesScreenContainer, AesScreenHeader, AesStatusBadge } from '../components';

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
      <AesScreenContainer>
        <AesScreenHeader title={t('list.restrictedTitle')} />
        <View style={styles.centeredState}>
          <Text style={[styles.restrictedText, { color: aesColors.textSecondary }]}>
            {t('list.restrictedMessage')}
          </Text>
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
        <Text style={[styles.queueButtonText, { color: aesColors.accentGreen }]}>
          {t('list.adminQueueShortcut')}
        </Text>
      </TouchableOpacity>
    ) : undefined;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AesScreenContainer>
      <AesScreenHeader title={listTitle} rightElement={headerRightElement} />

      {/* Filter chip bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipBar}
        contentContainerStyle={styles.chipBarContent}
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
              accessibilityState={{ selected: isActive }}
              testID={`filter-chip-${chip.key}`}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? aesColors.textInverse : aesColors.textPrimary },
                ]}
              >
                {t(chip.labelKey as any)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator color={aesColors.accentGreen} />
        </View>
      ) : error ? (
        <View style={styles.centeredState}>
          <Text style={[styles.errorText, { color: aesColors.textPrimary }]}>{error}</Text>
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
              <Text style={[styles.emptyText, { color: aesColors.textSecondary }]}>
                {t('list.empty')}
              </Text>
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
                <Text style={styles.newButtonText}>+ {t('list.newButton')}</Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: aesColors.surface }]}
              onPress={() =>
                navigation.navigate('declarationDetails', { declarationId: item.id })
              }
              accessibilityRole="button"
              accessibilityLabel={`${t('list.refNumber')} ${item.reference_number}`}
              testID={`declaration-card-${item.id}`}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.referenceText, { color: aesColors.textPrimary }]}>
                  {item.reference_number || t('list.refUnavailable')}
                </Text>
                <AesStatusBadge status={item.status} domain="declaration" />
              </View>
              {item.incident_date ? (
                <Text style={[styles.cardMeta, { color: aesColors.textSecondary }]}>
                  {`${t('list.incidentDate')}: ${item.incident_date}`}
                </Text>
              ) : null}
              {item.incident_type ? (
                <Text style={[styles.cardMeta, { color: aesColors.textSecondary }]}>
                  {`${t('list.incidentType')}: ${(t as any)(`form.incidentType.${item.incident_type.replace('_exposure', '')}`) ?? item.incident_type}`}
                </Text>
              ) : null}
              {item.circumstances ? (
                <Text
                  style={[styles.cardCircumstances, { color: aesColors.textPrimary }]}
                >
                  {item.circumstances}
                </Text>
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

const styles = StyleSheet.create({
  chipBar: {
    flexGrow: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: aesColors.borderSubdued,
  },
  chipBarContent: {
    flexDirection: 'row',
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingVertical: aesSpacing.sm,
    gap: aesSpacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderRadius: aesRadii.pill,
    paddingHorizontal: aesSpacing.md,
    paddingVertical: aesSpacing.xs,
  },
  chipActive: {
    backgroundColor: aesColors.accentGreen,
    borderColor: aesColors.accentGreen,
  },
  chipInactive: {
    backgroundColor: aesColors.surface,
    borderColor: aesColors.borderMedium,
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
    borderColor: aesColors.borderSubdued,
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
    marginRight: aesSpacing.sm,
  },
  cardMeta: {
    ...aesTypography.bodySmall,
    marginTop: 2,
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
    backgroundColor: aesColors.primaryAction,
    alignItems: 'center',
  },
  newButtonText: {
    color: aesColors.textInverse,
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
