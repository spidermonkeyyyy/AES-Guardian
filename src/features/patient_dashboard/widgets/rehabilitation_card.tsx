import React from 'react';

/**
 * RehabilitationCard — minimal integration card.
 * 
 * Source-backed: derived from Flutter `rehabilitation_card.dart` (real widget).
 * Classification: MIGRATE AS-IS — no placeholder behavior claimed.
 * 
 * RN difference from Flutter: uses plain text instead of themed card.
 * No interactive behavior beyond display.
 */
export const RehabilitationCard: React.FC<{ title?: string; subtitle?: string }> = ({
  title = 'Rééducation',
  subtitle = 'Sessions this week',
}) => {
  return (
    <div
      style={{
        padding: '12px',
        background: colors.card,
        borderRadius: '8px',
        marginBottom: '12px',
        fontFamily: 'system-ui, sans-serif',
        border: '1px solid colors.border',
      }}
    >
      <div style={{ fontWeight: 500, marginBottom: '4px' }}>{title}</div>
      <div style={{ color: colors.mutedForeground, fontSize: '0.875rem' }}>{subtitle}</div>
    </div>
  );
};