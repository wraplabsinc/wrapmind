export function daysAgo(days, hours = 0, minutes = 0) {
  const d = new Date(Date.now()
    - days * 86400000
    - hours * 3600000
    - minutes * 60000);
  return d.toISOString();
}

export function daysAhead(days) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

export function makeSeedDate(offsetDays) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  // Return YYYY-MM-DD (local date)
  return d.toISOString().split('T')[0];
}
