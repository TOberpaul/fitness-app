import type { ExportData } from '../types';
import { validateDailyMeasurement, validateWeeklyMeasurement } from '../utils/validation';
import { formatDate } from '../utils/date';

/**
 * Serialize ExportData to pretty-printed JSON string with 2-space indent.
 */
export function serialize(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Validate that unknown data conforms to the ExportData schema.
 * Checks version, required fields, arrays, and each measurement's validity.
 */
export function validate(data: unknown): data is ExportData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (obj.version !== 1) {
    return false;
  }

  if (typeof obj.exportedAt !== 'string') {
    return false;
  }

  if (!Array.isArray(obj.dailyMeasurements)) {
    return false;
  }

  if (!Array.isArray(obj.weeklyMeasurements)) {
    return false;
  }

  for (const m of obj.dailyMeasurements) {
    const result = validateDailyMeasurement(m);
    if (!result.valid) {
      return false;
    }
  }

  for (const m of obj.weeklyMeasurements) {
    const result = validateWeeklyMeasurement(m);
    if (!result.valid) {
      return false;
    }
  }

  return true;
}

/**
 * Deserialize a JSON string into a validated ExportData object.
 * Throws descriptive errors for invalid JSON or schema mismatches.
 */
export function deserialize(json: string): ExportData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON: unable to parse input string');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid data: expected an object');
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.version !== 1) {
    throw new Error('Invalid data: "version" must be 1');
  }

  if (typeof obj.exportedAt !== 'string') {
    throw new Error('Invalid data: "exportedAt" must be a string');
  }

  if (!Array.isArray(obj.dailyMeasurements)) {
    throw new Error('Invalid data: "dailyMeasurements" must be an array');
  }

  if (!Array.isArray(obj.weeklyMeasurements)) {
    throw new Error('Invalid data: "weeklyMeasurements" must be an array');
  }

  for (let i = 0; i < obj.dailyMeasurements.length; i++) {
    const result = validateDailyMeasurement(obj.dailyMeasurements[i]);
    if (!result.valid) {
      throw new Error(`Invalid daily measurement at index ${i}: ${result.errors.join(', ')}`);
    }
  }

  for (let i = 0; i < obj.weeklyMeasurements.length; i++) {
    const result = validateWeeklyMeasurement(obj.weeklyMeasurements[i]);
    if (!result.valid) {
      throw new Error(`Invalid weekly measurement at index ${i}: ${result.errors.join(', ')}`);
    }
  }

  return parsed as ExportData;
}

/**
 * Export data as a downloadable JSON file.
 * Creates a Blob, triggers a download as `fitness-data-YYYY-MM-DD.json`.
 */
export function exportToFile(data: ExportData): void {
  const json = serialize(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = formatDate(new Date());
  const filename = `fitness-data-${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Import and validate ExportData from a File object.
 * Reads the file as text, deserializes, and returns validated data.
 */
export function importFromFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const data = deserialize(text);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}
