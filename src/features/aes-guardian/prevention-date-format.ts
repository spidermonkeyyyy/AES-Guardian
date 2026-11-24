import type { SupportedLocale } from '../../localization';

const LOCALE_TAGS: Record<SupportedLocale, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  ar: 'ar',
};

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/i;

function parseDateOnly(value: string): Date | null {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatPreventionDate(
  value: string | null | undefined,
  locale: SupportedLocale,
  includeTime = false,
): string | null {
  if (!value) return null;

  let date: Date;
  if (DATE_ONLY_PATTERN.test(value)) {
    const parsedDate = parseDateOnly(value);
    if (!parsedDate) return null;
    date = parsedDate;
  } else {
    if (!TIMESTAMP_PATTERN.test(value) || !parseDateOnly(value.slice(0, 10))) return null;
    date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
  }

  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'UTC',
  }).format(date);
}
