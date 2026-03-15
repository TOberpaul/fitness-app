import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DailyInputView from './DailyInputView';
import { resetDB } from '../services/db';
import * as dataService from '../services/dataService';

beforeEach(() => {
  resetDB();
  indexedDB.deleteDatabase('fitness-tracker');
});

describe('DailyInputView', () => {
  it('renders all form fields', () => {
    render(<DailyInputView />);
    expect(screen.getByLabelText('Datum')).toBeDefined();
    expect(screen.getByLabelText('Gewicht (kg)')).toBeDefined();
    expect(screen.getByLabelText('Körperfett (%)')).toBeDefined();
    expect(screen.getByText('Speichern')).toBeDefined();
  });

  it('pre-fills date with today', () => {
    render(<DailyInputView />);
    const dateInput = screen.getByLabelText('Datum') as HTMLInputElement;
    const today = new Date().toISOString().slice(0, 10);
    expect(dateInput.value).toBe(today);
  });

  it('weight input has inputmode decimal', () => {
    render(<DailyInputView />);
    const weightInput = screen.getByLabelText('Gewicht (kg)');
    expect(weightInput.getAttribute('inputmode')).toBe('decimal');
  });

  it('body fat input has inputmode decimal', () => {
    render(<DailyInputView />);
    const bodyFatInput = screen.getByLabelText('Körperfett (%)');
    expect(bodyFatInput.getAttribute('inputmode')).toBe('decimal');
  });

  it('shows validation error for weight out of range', async () => {
    render(<DailyInputView />);
    const weightInput = screen.getByLabelText('Gewicht (kg)');
    fireEvent.change(weightInput, { target: { value: '5' } });
    fireEvent.click(screen.getByText('Speichern'));
    await waitFor(() => {
      expect(screen.getByText(/Gewicht muss zwischen 30 und 300 kg liegen/)).toBeDefined();
    });
  });

  it('shows validation error for body fat out of range', async () => {
    render(<DailyInputView />);
    const bodyFatInput = screen.getByLabelText('Körperfett (%)');
    fireEvent.change(bodyFatInput, { target: { value: '99' } });
    fireEvent.click(screen.getByText('Speichern'));
    await waitFor(() => {
      expect(screen.getByText(/Körperfett muss zwischen 1 und 60% liegen/)).toBeDefined();
    });
  });

  it('does not show errors for empty optional fields', () => {
    render(<DailyInputView />);
    fireEvent.click(screen.getByText('Speichern'));
    expect(screen.queryByText(/muss zwischen/)).toBeNull();
  });

  it('saves valid measurement via DataService', async () => {
    const saveSpy = vi.spyOn(dataService, 'saveDailyMeasurement').mockResolvedValue();

    render(<DailyInputView />);

    fireEvent.change(screen.getByLabelText('Gewicht (kg)'), { target: { value: '75.3' } });
    fireEvent.change(screen.getByLabelText('Körperfett (%)'), { target: { value: '20.1' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Speichern'));
    });

    await waitFor(() => {
      expect(screen.getByText('Gespeichert!')).toBeDefined();
    });

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        weight: 75.3,
        bodyFat: 20.1,
        source: 'manual',
      })
    );

    saveSpy.mockRestore();
  });

  it('loads existing values for selected date', async () => {
    const today = new Date().toISOString().slice(0, 10);
    vi.spyOn(dataService, 'getDailyMeasurement').mockResolvedValue({
      date: today,
      weight: 82.0,
      bodyFat: 15.5,
      source: 'manual',
      updatedAt: new Date().toISOString(),
    });

    render(<DailyInputView />);

    await waitFor(() => {
      const weightInput = screen.getByLabelText('Gewicht (kg)') as HTMLInputElement;
      expect(weightInput.value).toBe('82');
    });

    const bodyFatInput = screen.getByLabelText('Körperfett (%)') as HTMLInputElement;
    expect(bodyFatInput.value).toBe('15.5');

    vi.restoreAllMocks();
  });

  it('save button has correct data attributes', () => {
    render(<DailyInputView />);
    const saveBtn = screen.getByText('Speichern');
    expect(saveBtn.getAttribute('data-material')).toBe('inverted');
    expect(saveBtn.hasAttribute('data-interactive')).toBe(true);
  });

  it('rounds values to one decimal on save', async () => {
    const saveSpy = vi.spyOn(dataService, 'saveDailyMeasurement').mockResolvedValue();

    render(<DailyInputView />);

    fireEvent.change(screen.getByLabelText('Gewicht (kg)'), { target: { value: '75.37' } });
    fireEvent.change(screen.getByLabelText('Körperfett (%)'), { target: { value: '20.14' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Speichern'));
    });

    await waitFor(() => {
      expect(screen.getByText('Gespeichert!')).toBeDefined();
    });

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        weight: 75.4,
        bodyFat: 20.1,
      })
    );

    saveSpy.mockRestore();
  });

  it('clears errors when input changes', async () => {
    render(<DailyInputView />);
    const weightInput = screen.getByLabelText('Gewicht (kg)');

    fireEvent.change(weightInput, { target: { value: '5' } });
    fireEvent.click(screen.getByText('Speichern'));

    await waitFor(() => {
      expect(screen.getByText(/Gewicht muss zwischen/)).toBeDefined();
    });

    fireEvent.change(weightInput, { target: { value: '80' } });
    expect(screen.queryByText(/Gewicht muss zwischen/)).toBeNull();
  });
});
