/**
 * AES Guardian — Help Centre and AES Glossary Screen
 *
 * Dedicated educational resource and terminology reference:
 * - Persistent academic prototype disclaimer
 * - 8 structured guide sections covering the end-to-end workflow
 * - 14 controlled glossary terms with real-time search and category filtering
 * - Expandable/collapsible cards with full FR / EN / AR localization
 * - 100% offline, local execution with no external network requests
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { t, useLocale, TranslationKey } from '../../../localization';
import { RootStackParamList } from '../../../navigation/routes';

import AppText from '../../../components/AppText';
import AppTextInput from '../../../components/AppTextInput';
import { AppIcon, AppIconLabel } from '../../../components/AppIcon';
import { AesLifecycleVisual } from '../components';
type HelpGlossaryRouteProp = RouteProp<RootStackParamList, 'helpGlossary'>;

interface HelpSectionItem {
  id: string;
  number: string;
  titleKey: TranslationKey;
  contentKey: TranslationKey;
}

interface GlossaryItem {
  id: string;
  termKey: TranslationKey;
  categoryKey: TranslationKey;
  categoryGroup: 'exposure' | 'declaration' | 'admin' | 'oh' | 'quality';
  definitionKey: TranslationKey;
}

const HELP_SECTIONS: HelpSectionItem[] = [
  { id: 'sec1', number: '1', titleKey: 'help.section1.title', contentKey: 'help.section1.content' },
  { id: 'sec2', number: '2', titleKey: 'help.section2.title', contentKey: 'help.section2.content' },
  { id: 'sec3', number: '3', titleKey: 'help.section3.title', contentKey: 'help.section3.content' },
  { id: 'sec4', number: '4', titleKey: 'help.section4.title', contentKey: 'help.section4.content' },
  { id: 'sec5', number: '5', titleKey: 'help.section5.title', contentKey: 'help.section5.content' },
  { id: 'sec6', number: '6', titleKey: 'help.section6.title', contentKey: 'help.section6.content' },
  { id: 'sec7', number: '7', titleKey: 'help.section7.title', contentKey: 'help.section7.content' },
  { id: 'sec8', number: '8', titleKey: 'help.section8.title', contentKey: 'help.section8.content' },
];

const GLOSSARY_ITEMS: GlossaryItem[] = [
  { id: 't1', termKey: 'glossary.term1.term', categoryKey: 'glossary.term1.category', categoryGroup: 'exposure', definitionKey: 'glossary.term1.definition' },
  { id: 't2', termKey: 'glossary.term2.term', categoryKey: 'glossary.term2.category', categoryGroup: 'exposure', definitionKey: 'glossary.term2.definition' },
  { id: 't3', termKey: 'glossary.term3.term', categoryKey: 'glossary.term3.category', categoryGroup: 'exposure', definitionKey: 'glossary.term3.definition' },
  { id: 't4', termKey: 'glossary.term4.term', categoryKey: 'glossary.term4.category', categoryGroup: 'exposure', definitionKey: 'glossary.term4.definition' },
  { id: 't5', termKey: 'glossary.term5.term', categoryKey: 'glossary.term5.category', categoryGroup: 'declaration', definitionKey: 'glossary.term5.definition' },
  { id: 't6', termKey: 'glossary.term6.term', categoryKey: 'glossary.term6.category', categoryGroup: 'admin', definitionKey: 'glossary.term6.definition' },
  { id: 't7', termKey: 'glossary.term7.term', categoryKey: 'glossary.term7.category', categoryGroup: 'oh', definitionKey: 'glossary.term7.definition' },
  { id: 't8', termKey: 'glossary.term8.term', categoryKey: 'glossary.term8.category', categoryGroup: 'oh', definitionKey: 'glossary.term8.definition' },
  { id: 't9', termKey: 'glossary.term9.term', categoryKey: 'glossary.term9.category', categoryGroup: 'quality', definitionKey: 'glossary.term9.definition' },
  { id: 't10', termKey: 'glossary.term10.term', categoryKey: 'glossary.term10.category', categoryGroup: 'quality', definitionKey: 'glossary.term10.definition' },
  { id: 't11', termKey: 'glossary.term11.term', categoryKey: 'glossary.term11.category', categoryGroup: 'quality', definitionKey: 'glossary.term11.definition' },
  { id: 't12', termKey: 'glossary.term12.term', categoryKey: 'glossary.term12.category', categoryGroup: 'quality', definitionKey: 'glossary.term12.definition' },
  { id: 't13', termKey: 'glossary.term13.term', categoryKey: 'glossary.term13.category', categoryGroup: 'oh', definitionKey: 'glossary.term13.definition' },
  { id: 't14', termKey: 'glossary.term14.term', categoryKey: 'glossary.term14.category', categoryGroup: 'admin', definitionKey: 'glossary.term14.definition' },
];

export const HelpGlossaryScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<HelpGlossaryRouteProp>();
  const locale = useLocale();
  const styles = createStyles(colors);

  const initialTab = route.params?.initialSection === 'glossary' ? 'glossary' : 'help';
  const [activeTab, setActiveTab] = useState<'help' | 'glossary'>(initialTab);

  // Accordion state for help sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sec1: true,
  });

  // Search & filter state for glossary
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTerm = (id: string) => {
    setExpandedTerms((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredGlossary = useMemo(() => {
    const normalizeSearchText = (value: string) =>
      value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    return GLOSSARY_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.categoryGroup === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = normalizeSearchText(searchQuery.trim());
      const termText = normalizeSearchText(t(item.termKey, locale));
      const defText = normalizeSearchText(t(item.definitionKey, locale));
      return termText.includes(q) || defText.includes(q);
    });
  }, [searchQuery, selectedCategory, locale]);

  const categoryChips = [
    { id: 'all', labelKey: 'helpGlossary.categoryAll' as TranslationKey },
    { id: 'exposure', labelKey: 'helpGlossary.categoryExposure' as TranslationKey },
    { id: 'declaration', labelKey: 'helpGlossary.categoryDeclaration' as TranslationKey },
    { id: 'admin', labelKey: 'helpGlossary.categoryAdmin' as TranslationKey },
    { id: 'oh', labelKey: 'helpGlossary.categoryOH' as TranslationKey },
    { id: 'quality', labelKey: 'helpGlossary.categoryQuality' as TranslationKey },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={styles.title}>{t('helpGlossary.title', locale)}</AppText>
        <AppText style={styles.subtitle}>{t('helpGlossary.subtitle', locale)}</AppText>
      </View>

      {/* Academic Disclaimer Banner */}
      <View style={styles.disclaimerBanner}>
        <View style={styles.disclaimerRow}>
          <AppIcon name="alert-triangle" size={20} color={colors.warning} />
          <AppText style={styles.disclaimerText}>
            {t('helpGlossary.disclaimer', locale)}
          </AppText>
        </View>
      </View>

      {/* Segmented Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          testID="tab-help"
          style={[styles.tabButton, activeTab === 'help' && styles.tabButtonActive]}
          onPress={() => setActiveTab('help')}
          accessibilityRole="button"
          accessibilityLabel={t('helpGlossary.tabHelp', locale)}
          accessibilityState={{ selected: activeTab === 'help' }}
        >
          <AppIconLabel name="book-open" size="sm" textStyle={[styles.tabText, activeTab === 'help' && styles.tabTextActive]} style={styles.tabLabel}>
            {t('helpGlossary.tabHelp', locale)}
          </AppIconLabel>
        </TouchableOpacity>

        <TouchableOpacity
          testID="tab-glossary"
          style={[styles.tabButton, activeTab === 'glossary' && styles.tabButtonActive]}
          onPress={() => setActiveTab('glossary')}
          accessibilityRole="button"
          accessibilityLabel={t('helpGlossary.tabGlossary', locale)}
          accessibilityState={{ selected: activeTab === 'glossary' }}
        >
          <AppIconLabel name="book" size="sm" textStyle={[styles.tabText, activeTab === 'glossary' && styles.tabTextActive]} style={styles.tabLabel}>
            {t('helpGlossary.tabGlossary', locale)}
          </AppIconLabel>
        </TouchableOpacity>
      </View>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: HELP CENTRE                                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'help' && (
        <View style={styles.sectionList}>
          {HELP_SECTIONS.map((sec) => {
            const isExpanded = !!expandedSections[sec.id];
            return (
              <View key={sec.id} style={styles.card}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => toggleSection(sec.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t(sec.titleKey, locale)}
                  accessibilityState={{ expanded: isExpanded }}
                >
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.numberBadge}>
                      <AppText style={styles.numberBadgeText}>{sec.number}</AppText>
                    </View>
                    <AppText style={styles.cardTitle}>{t(sec.titleKey, locale)}</AppText>
                  </View>
                  <AppIcon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.cardBody}>
                    <AppText style={styles.cardContent}>
                      {t(sec.contentKey, locale)}
                    </AppText>
                    {sec.id === 'sec2' ? <AesLifecycleVisual /> : null}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: AES GLOSSARY                                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'glossary' && (
        <View style={styles.glossaryContainer}>
          {/* Search Input Box */}
          <View style={styles.searchBox}>
            <AppIcon name="search" size={18} color={colors.mutedForeground} />
            <AppTextInput
              bare
              style={styles.searchInput}
              placeholder={t('helpGlossary.searchPlaceholder', locale)}
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
              accessibilityLabel={t('helpGlossary.searchPlaceholder', locale)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                accessibilityRole="button"
                accessibilityLabel={t('helpGlossary.clearSearch', locale)}
              >
                <AppIcon name="cancel" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Chips ScrollView */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContainer}
          >
            {categoryChips.map((chip) => {
              const isSelected = selectedCategory === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  testID={`chip-${chip.id}`}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setSelectedCategory(chip.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t(chip.labelKey, locale)}
                  accessibilityState={{ selected: isSelected }}
                >
                  <AppText style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {t(chip.labelKey, locale)}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Filtered Glossary Term Cards */}
          {filteredGlossary.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <AppIcon name="search" size={32} color={colors.mutedForeground} />
              <AppText style={styles.emptyStateText}>
                {t('helpGlossary.emptySearch', locale)}
              </AppText>
            </View>
          ) : (
            filteredGlossary.map((item) => {
              const isExpanded = Boolean(expandedTerms[item.id]);
              return (
                <TouchableOpacity
                  key={item.id}
                  testID={`glossary-${item.id}`}
                  style={styles.glossaryCard}
                  onPress={() => toggleTerm(item.id)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t(item.termKey, locale)}
                  accessibilityState={{ expanded: isExpanded }}
                >
                  <View style={styles.glossaryHeaderRow}>
                    <View style={styles.glossaryTermInfo}>
                      <View style={styles.termTitleRow}>
                        <AppText style={styles.glossaryTermTitle}>
                          {t(item.termKey, locale)}
                        </AppText>
                        <View style={styles.categoryBadge}>
                          <AppText style={styles.categoryBadgeText}>
                            {t(item.categoryKey, locale)}
                          </AppText>
                        </View>
                      </View>
                    </View>
                    <AppIcon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
                  </View>

                  {isExpanded && (
                    <AppText style={styles.glossaryDefinition}>
                      {t(item.definitionKey, locale)}
                    </AppText>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      {/* Back to Workspace Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel={t('helpGlossary.backToWorkspace', locale)}
      >
        <AppIconLabel name="back" size="sm" textStyle={styles.backButtonText} style={styles.backButtonLabel}>
          {t('helpGlossary.backToWorkspace', locale)}
        </AppIconLabel>
      </TouchableOpacity>
    </ScrollView>
  );
};

function createStyles(colors: any) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    header: {
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
    },
    disclaimerBanner: {
      backgroundColor: colors.warningBackground,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
      borderRadius: shapes.sm,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    disclaimerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
    },
    disclaimerIcon: {
      fontSize: 14,
    },
    disclaimerText: {
      flex: 1,
      fontSize: typography.fontSize.xs - 1,
      color: colors.warning,
      lineHeight: 16,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: shapes.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 3,
      marginBottom: spacing.md,
    },
    tabButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: shapes.sm,
    },
    tabButtonActive: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      color: colors.foreground,
    },
    tabTextActive: {
      color: colors.primaryForeground ?? '#ffffff',
      fontWeight: typography.fontWeight.bold,
    },
    tabLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    sectionList: {
      gap: spacing.sm,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: shapes.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
    },
    cardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    numberBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numberBadgeText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
    },
    cardTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
      flex: 1,
    },
    chevron: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginLeft: spacing.xs,
    },
    cardBody: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.sm,
    },
    cardContent: {
      fontSize: typography.fontSize.xs,
      color: colors.foreground,
      lineHeight: 18,
    },
    glossaryContainer: {
      gap: spacing.sm,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: shapes.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      height: 42,
    },
    searchIcon: {
      fontSize: 14,
      marginRight: spacing.xs,
    },
    searchInput: {
      flex: 1,
      fontSize: typography.fontSize.xs,
      color: colors.foreground,
      paddingVertical: 0,
    },
    clearIcon: {
      fontSize: 14,
      color: colors.mutedForeground,
      paddingHorizontal: spacing.xs,
    },
    chipsScroll: {
      marginBottom: spacing.xs,
    },
    chipsContainer: {
      gap: spacing.xs,
      paddingVertical: 2,
    },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: shapes.full,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: typography.fontSize.xs - 1,
      color: colors.foreground,
      fontWeight: typography.fontWeight.medium,
    },
    chipTextActive: {
      color: colors.primaryForeground ?? '#ffffff',
      fontWeight: typography.fontWeight.bold,
    },
    glossaryCard: {
      backgroundColor: colors.card,
      borderRadius: shapes.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    glossaryHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    glossaryTermInfo: {
      flex: 1,
    },
    termTitleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    glossaryTermTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
    },
    categoryBadge: {
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: spacing.xs,
      paddingVertical: 1,
      borderRadius: shapes.sm,
    },
    categoryBadgeText: {
      fontSize: typography.fontSize.xs - 2,
      color: colors.mutedForeground,
      fontWeight: typography.fontWeight.medium,
    },
    chevronSmall: {
      fontSize: 10,
      color: colors.mutedForeground,
      marginLeft: spacing.xs,
      marginTop: 3,
    },
    glossaryDefinition: {
      fontSize: typography.fontSize.xs,
      color: colors.foreground,
      lineHeight: 18,
      marginTop: spacing.xs,
    },
    emptyStateBox: {
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderRadius: shapes.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyStateIcon: {
      fontSize: 32,
      marginBottom: spacing.xs,
    },
    emptyStateText: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
    backButton: {
      marginTop: spacing.lg,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    backButtonText: {
      fontSize: typography.fontSize.xs,
      color: colors.primary,
      fontWeight: typography.fontWeight.bold,
    },
    backButtonLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
  });
}
