import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import WeeklyInputView from './WeeklyInputView';
import { resetDB } from '../services/db';
import * as dataService from '../services/dataService';
import * as dateUtils from '../utils/date';

beforeEach(() => {
  resetDB();
  indexedDB.deleteDatabase('fitness-tracker');
});

describe('WeeklyInputView', () => {
  it('renders all form fields', () => {
    render(<WeeklyInputView />);
    expect(screen.getByText('Wöchentliche Eingabe')).toBeDefined();
    expect(screen.getByLabelText('Brust (cm)')).toBeDefined();
    expect(screen.getByLabelText('Taille (cm)')).toBeDefined();
    expect(screen.getByLabelText('Hüfte (cm)')).toBeDefined();
    expect(screen.getByLabelText('Bauch (cm)')).toBeDefined();
    expect(screen.getByLabelText('Oberarm (cm)')).toBeDefined();
    expect(screen.getByLabelText('Oberschenkel (cm)')).toBeDefined();
    expect(screen.getByText('Speichern')).toBeDefined();
  });

  it('displays the week start date', () => {
    const weekStart = dateUtils.getWeekStart(new Date());
    render(<WeeklyInputView />);
    expect(screen.getByText(`Woche ab ${weekStart}`)).toBeDefined();
  });

  it('all inputs have inputmode decimal', () => {
    render(<WeeklyInputView />);
    const labels = [
      'Brust (cm)', 'Taille (cm)', 'Hüfte (cm)',
      'Bauch (cm)', 'Oberarm (cm)', 'Oberschenkel (cm)',
    ];
    for (const label of labels) {
      const input = screen.getByLabelText(label);
      expect(input.getAttribute('inputmode')).toBe('decimal');
    }
  });

  it('shows validation error for value out of range', async () => {
    render(<WeeklyInputView />);
    fireEvent.change(screen.getByLabelText('Brust (cm)'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('Speichern'));
    await waitFor(() => {
      expect(screen.getByText(/Brust muss zwischen 10 und 200 cm liegen/)).toBeDefined();
    });
  });

  it('shows validation error for value above max', async () => {
    render(<WeeklyInputView />);
    fireEvent.change(screen.getByLabelText('Taille (cm)'), { target: { value: '250' } });
    fireEvent.click(screen.getByText('Speichern'));
    await waitFor(() => {
      expect(screen.getByText(/Taille muss zwischen 10 und 200 cm liegen/)).toBeDefined();
    });
  });

  it('does not show errors for empty optional fields', () => {
    render(<WeeklyInputView />);
    fireEvent.click(screen.getByText('Speichern'));
    expect(screen.queryByText(/muss zwischen/)).toBeNull();
  });

  it('saves valid measurement via DataService', async () => {
    const saveSpy = vi.spyOn(dataService, 'saveWeeklyMeasurement').mockResolvedValue();
    const weekStart = dateUtils.getWeekStart(new Date());

    render(<WeeklyInputView />);

    fireEvent.change(screen.getByLabelText('Brust (cm)'), { target: { value: '95.3' } });
    fireEvent.change(screen.getByLabelText('Taille (cm)'), { target: { value: '80.1' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Speichern'));
    });

    await waitFor(() => {
      expect(screen.getByText('Gespeichert!')).toBeDefined();
    });

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        date: weekStart,
        chest: 95.3,
        waist: 80.1,
      })
    );

    saveSpy.mockRestore();
  });

  it('loads existing values for current week', async () => {
    const weekStart = dateUtils.getWeekStart(new Date());
    vi.spyOn(dataService, 'getWeeklyMeasurement').mockResolvedValue({
      date: weekStart,
      chest: 96.0,
      waist: 82.5,
      hip: 100.0,
      belly: 88.0,
      upperArm: 33.0,
      thigh: 55.0,
      updatedAt: new Date().toISOString(),
    });

    render(<WeeklyInputView />);

    await waitFor(() => {
      expect((screen.getByLabelText('Brust (cm)') as HTMLInputElement).value).toBe('96');
    });

    expect((screen.getByLabelText('Taille (cm)') as HTMLInputElement).value).toBe('82.5');
    expect((screen.getByLabelText('Hüfte (cm)') as HTMLInputElement).value).toBe('100');
    expect((screen.getByLabelText('Bauch (cm)') as HTMLInputElement).value).toBe('88');
    expect((screen.getByLabelText('Oberarm (cm)') as HTMLInputElement).value).toBe('33');
    expect((screen.getByLabelText('Oberschenkel (cm)') as HTMLInputElement).value).toBe('55');

    vi.restoreAllMocks();
  });

  it('save button has correct data attributes', () => {
    render(<WeeklyInputView />);
    const saveBtn = screen.getByText('Speichern');
    expect(saveBtn.getAttribute('data-material')).toBe('vibrant');
    expect(saveBtn.hasAttribute('data-interactive')).toBe(true);
  });

  it('rounds values to one decimal on save', async () => {
    const saveSpy = vi.spyOn(dataService, 'saveWeeklyMeasurement').mockResolvedValue();

    render(<WeeklyInputView />);

    fireEvent.change(screen.getByLabelText('Brust (cm)'), { target: { value: '95.37' } });
    fireEvent.change(screen.getByLabelText('Hüfte (cm)'), { target: { value: '100.14' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Speichern'));
    });

    await waitFor(() => {
      expect(screen.getByText('Gespeichert!')).toBeDefined();
    });

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        chest: 95.4,
        hip: 100.1,
      })
    );

    saveSpy.mockRestore();
  });

  it('clears error when input changes', async () => {
    render(<WeeklyInputView />);
    const chestInput = screen.getByLabelText('Brust (cm)');

    fireEvent.change(chestInput, { target: { value: '5' } });
    fireEvent.click(screen.getByText('Speichern'));

    await waitFor(() => {
      expect(screen.getByText(/Brust muss zwischen/)).toBeDefined();
    });

    fireEvent.change(chestInput, { target: { value: '90' } });
    expect(screen.queryByText(/Brust muss zwischen/)).toBeNull();
  });

  it('shows validation errors for non-numeric input', async () => {
    render(<WeeklyInputView />);
    fireEvent.change(screen.getByLabelText('Brust (cm)'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByText('Speichern'));
    await waitFor(() => {
      expect(screen.getByText(/Brust muss zwischen 10 und 200 cm liegen/)).toBeDefined();
    });
  });
});
