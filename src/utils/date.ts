import type { TimeRange, DataPoint } from '../types';
import { roundToOneDecimal } from './validation';

/** Format a Date object as YYYY-MM-DD string */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Get the Monday of the week for a given date. Returns YYYY-MM-DD string. */
export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

/** Get a date range based on a TimeRange filter relative to today */
export function getDateRange(range: TimeRange): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  switch (range) {
    case '1W': from.setDate(from.getDate() - 7); break;
    case '1M': from.setMonth(from.getMonth() - 1); break;
    case '3M': from.setMonth(from.getMonth() - 3); break;
    case '6M': from.setMonth(from.getMonth() - 6); break;
    case '1J': from.setFullYear(from.getFullYear() - 1); break;
    case 'Max': from.setFullYear(2000); break;
  }
  return { from: formatDate(from), to: formatDate(to) };
}

/** Calculate percentage change from start to current value, rounded to one decimal */
export function calculatePercentChange(start: number, current: number): number {
  if (start === 0) return 0;
  return roundToOneDecimal(((current - start) / start) * 100);
}

/** Determine trend direction based on first and last data points */
export function determineTrend(data: DataPoint[]): 'up' | 'down' | 'flat' {
  if (data.length < 2) return 'flat';
  const first = data[0].value;
  const last = data[data.length - 1].value;
  if (last < first) return 'down';
  if (last > first) return 'up';
  return 'flat';
}
