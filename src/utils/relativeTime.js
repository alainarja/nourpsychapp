// "Just now" / "5m ago" / "3h ago" / "2d ago", using i18n keys time.*
export function relativeTime(iso, t, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return t('time.justNow');
  if (mins < 60) return t('time.minutes', undefined, { n: mins });
  const hours = Math.round(mins / 60);
  if (hours < 24) return t('time.hours', undefined, { n: hours });
  return t('time.days', undefined, { n: Math.round(hours / 24) });
}
