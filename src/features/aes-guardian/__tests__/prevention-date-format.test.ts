import { formatPreventionDate } from '../prevention-date-format';

const dateOptions: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
};

describe('formatPreventionDate', () => {
  test.each([
    ['fr', 'fr-FR'],
    ['en', 'en-GB'],
    ['ar', 'ar'],
  ] as const)('formats date-only values for %s without shifting the calendar day', (locale, tag) => {
    const expected = new Intl.DateTimeFormat(tag, dateOptions).format(
      new Date(Date.UTC(2026, 11, 15)),
    );
    expect(formatPreventionDate('2026-12-15', locale)).toBe(expected);
  });

  test('formats qualified timestamps in UTC and includes time only when requested', () => {
    const value = '2026-10-01T12:30:00+02:00';
    const expected = new Intl.DateTimeFormat('en-GB', {
      ...dateOptions,
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date('2026-10-01T10:30:00Z'));
    expect(formatPreventionDate(value, 'en', true)).toBe(expected);
    expect(formatPreventionDate(value, 'en')).not.toContain('12:30');
  });

  test.each([
    '',
    '2026-02-29',
    '2026-13-01',
    '2026-10-01T10:00:00',
    '2026-02-31T10:00:00Z',
    'not-a-date',
  ])('returns null for missing or invalid input %s', value => {
    expect(formatPreventionDate(value, 'en')).toBeNull();
  });
});
