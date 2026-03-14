import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  serialize,
  deserialize,
  validate,
  exportToFile,
  importFromFile,
} from './serializationService';
import type { ExportData } from '../types';

const validExportData: ExportData = {
  version: 1,
  exportedAt: '2024-01-15T10:00:00.000Z',
  dailyMeasurements: [
    { date: '2024-01-15', weight: 80.5, bodyFat: 20.1, source: 'manual', updatedAt: '2024-01-15T10:00:00.000Z' },
  ],
  weeklyMeasurements: [
    { date: '2024-01-15', chest: 100, waist: 85.5, updatedAt: '2024-01-15T10:00:00.000Z' },
  ],
};

const emptyExportData: ExportData = {
  version: 1,
  exportedAt: '2024-01-15T10:00:00.000Z',
  dailyMeasurements: [],
  weeklyMeasurements: [],
};

describe('serialize', () => {
  it('produces pretty-printed JSON with 2-space indent', () => {
    const result = serialize(emptyExportData);
    expect(result).toBe(JSON.stringify(emptyExportData, null, 2));
    expect(result).toContain('\n');
    expect(result).toContain('  ');
  });

  it('produces valid JSON', () => {
    const result = serialize(validExportData);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('includes all required fields', () => {
    const result = serialize(validExportData);
    const parsed = JSON.parse(result);
    expect(parsed.version).toBe(1);
    expect(parsed.exportedAt).toBe('2024-01-15T10:00:00.000Z');
    expect(parsed.dailyMeasurements).toHaveLength(1);
    expect(parsed.weeklyMeasurements).toHaveLength(1);
  });
});

describe('validate', () => {
  it('returns true for valid ExportData', () => {
    expect(validate(validExportData)).toBe(true);
  });

  it('returns true for empty arrays', () => {
    expect(validate(emptyExportData)).toBe(true);
  });

  it('returns false for null', () => {
    expect(validate(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(validate('string')).toBe(false);
    expect(validate(42)).toBe(false);
  });

  it('returns false for wrong version', () => {
    expect(validate({ ...emptyExportData, version: 2 })).toBe(false);
  });

  it('returns false for missing version', () => {
    const { version, ...rest } = emptyExportData;
    expect(validate(rest)).toBe(false);
  });

  it('returns false for missing exportedAt', () => {
    const { exportedAt, ...rest } = emptyExportData;
    expect(validate(rest)).toBe(false);
  });

  it('returns false for non-string exportedAt', () => {
    expect(validate({ ...emptyExportData, exportedAt: 123 })).toBe(false);
  });

  it('returns false for non-array dailyMeasurements', () => {
    expect(validate({ ...emptyExportData, dailyMeasurements: 'not-array' })).toBe(false);
  });

  it('returns false for non-array weeklyMeasurements', () => {
    expect(validate({ ...emptyExportData, weeklyMeasurements: {} })).toBe(false);
  });

  it('returns false for invalid daily measurement in array', () => {
    expect(validate({
      ...emptyExportData,
      dailyMeasurements: [{ date: '2024-01-15', weight: 500 }],
    })).toBe(false);
  });

  it('returns false for invalid weekly measurement in array', () => {
    expect(validate({
      ...emptyExportData,
      weeklyMeasurements: [{ date: '2024-01-15', waist: 5 }],
    })).toBe(false);
  });
});

describe('deserialize', () => {
  it('parses valid JSON and returns ExportData', () => {
    const json = JSON.stringify(validExportData);
    const result = deserialize(json);
    expect(result).toEqual(validExportData);
  });

  it('throws for invalid JSON', () => {
    expect(() => deserialize('not json')).toThrow('Invalid JSON');
  });

  it('throws for non-object JSON', () => {
    expect(() => deserialize('"just a string"')).toThrow('expected an object');
  });

  it('throws for wrong version', () => {
    const json = JSON.stringify({ ...emptyExportData, version: 2 });
    expect(() => deserialize(json)).toThrow('"version" must be 1');
  });

  it('throws for missing exportedAt', () => {
    const { exportedAt, ...rest } = emptyExportData;
    const json = JSON.stringify({ ...rest, version: 1 });
    expect(() => deserialize(json)).toThrow('"exportedAt" must be a string');
  });

  it('throws for non-array dailyMeasurements', () => {
    const json = JSON.stringify({ ...emptyExportData, dailyMeasurements: 'bad' });
    expect(() => deserialize(json)).toThrow('"dailyMeasurements" must be an array');
  });

  it('throws for non-array weeklyMeasurements', () => {
    const json = JSON.stringify({ ...emptyExportData, weeklyMeasurements: null });
    expect(() => deserialize(json)).toThrow('"weeklyMeasurements" must be an array');
  });

  it('throws descriptive error for invalid daily measurement', () => {
    const json = JSON.stringify({
      ...emptyExportData,
      dailyMeasurements: [{ date: '2024-01-15', weight: 500 }],
    });
    expect(() => deserialize(json)).toThrow('Invalid daily measurement at index 0');
  });

  it('throws descriptive error for invalid weekly measurement', () => {
    const json = JSON.stringify({
      ...emptyExportData,
      weeklyMeasurements: [{ date: '2024-01-15', chest: 999 }],
    });
    expect(() => deserialize(json)).toThrow('Invalid weekly measurement at index 0');
  });
});

describe('exportToFile', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a download link with correct filename pattern', () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:test-url');
    const revokeObjectURLMock = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: createObjectURLMock, revokeObjectURL: revokeObjectURLMock });

    const clickMock = vi.fn();
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickMock,
    } as unknown as HTMLAnchorElement);

    exportToFile(emptyExportData);

    expect(createObjectURLMock).toHaveBeenCalledOnce();
    const blob = createObjectURLMock.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json');

    const link = createElementSpy.mock.results[0].value as unknown as { download: string };
    expect(link.download).toMatch(/^fitness-data-\d{4}-\d{2}-\d{2}\.json$/);

    expect(clickMock).toHaveBeenCalledOnce();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:test-url');

    createElementSpy.mockRestore();
  });
});

describe('importFromFile', () => {
  it('reads and deserializes a valid file', async () => {
    const json = JSON.stringify(validExportData);
    const file = new File([json], 'test.json', { type: 'application/json' });

    const result = await importFromFile(file);
    expect(result).toEqual(validExportData);
  });

  it('rejects with error for invalid JSON file', async () => {
    const file = new File(['not json'], 'bad.json', { type: 'application/json' });

    await expect(importFromFile(file)).rejects.toThrow('Invalid JSON');
  });

  it('rejects with error for invalid schema', async () => {
    const json = JSON.stringify({ version: 2 });
    const file = new File([json], 'bad.json', { type: 'application/json' });

    await expect(importFromFile(file)).rejects.toThrow('"version" must be 1');
  });
});
