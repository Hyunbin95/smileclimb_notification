export function prevMonth(year, month) {
  month -= 1;
  if (month === 0) return { year: year - 1, month: 12 };
  return { year, month };
}

export function nextMonth(year, month) {
  month += 1;
  if (month === 13) return { year: year + 1, month: 1 };
  return { year, month };
}

export function nowYM() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
