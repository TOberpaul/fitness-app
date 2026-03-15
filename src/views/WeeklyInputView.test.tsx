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
  it('renders intro screen with instructions', () => {
    render(<WeeklyInputView />);
    expect(screen.getByText('Wöchentliche Umfangmessung')).toBeDefined();
    expect(screen.getByText(/Maßband/)).toBeDefined();
    expect(screen.getByText('Messung starten')).toBeDefined();
  });

  it('displays the week start date on intro', () => {
    const weekStart = dateUtils.getWeekStart(new Date());
    render(<WeeklyInputView />);
    expect(screen.getByText(`Woche ab ${weekStart}`)).toBeDefined();
  });

  it('navigates from intro to first zone step', () => {
    render(<WeeklyInputView />);
    fireEvent.click(screen.getByText('Messung starten'));
    expect(screen.getByText('Brust')).toBeDefined();
    expect(screen.getByText('Messung (1/6)')).toBeDefined();
  });

  it('shows all zone steps in correct order', () => {
    const zones = ['Brust', 'Taille', 'Bauch', 'Hüfte', 'Oberarm', 'Oberschenkel'];
    render(<WeeklyInputView />);
    fireEvent.click(screen.getByText('Messung starten'));

    for (let i = 0; i < zones.length; i++) {
      expect(screen.getByText(zones[i])).toBeDefined();
      expect(screen.getByText(`Messung (${i + 1}/6)`)).toBeDefined();
      fireEvent.click(screen.getByText('Überspringen'));
    }
    // After all zones, should be on summary
    expect(screen.getByText('Zusammenfassung')).toBeDefined();
  });

  it('validates input on next and shows error', () => {
    render(<WeeklyInputView />);
    fireEvent.click(screen.getByText('Messung starten')); // go to Brust step

    const input = screen.getByLabelText('Brust');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByText('Weiter'));

    expect(screen.getByText(/muss zwischen 10 und 200 cm liegen/)).toBeDefined();
  });

  it('clears error when input changes', () => {
    render(<WeeklyInputView />);
    fireEvent.click(screen.getByText('Messung starten')); // go to Brust step

    const input = screen.getByLabelText('Brust');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByText('Weiter'));
    expect(screen.getByText(/muss zwischen/)).toBeDefined();

    fireEvent.change(input, { target: { value: '90' } });
    expect(screen.queryByText(/muss zwischen/)).toBeNull();
  });

  it('advances to next step on valid input', () => {
    render(<WeeklyInputView />);
    fireEvent.click(screen.getByText('Messung starten')); // go to Brust step

    const input = screen.getByLabelText('Brust');
    fireEvent.change(input, { target: { value: '95.3' } });
    fireEvent.click(screen.getByText('Weiter'));

    // Should now be on Taille step
    expect(screen.getByText('Taille')).toBeDefined();
    expect(screen.getByText('Messung (2/6)')).toBeDefined();
  });

  it('skip advances without recording a value', () => {
    render(<WeeklyInputView />);
    fireEvent.click(screen.getByText('Messung starten')); // go to Brust step
    fireEvent.click(screen.getByText('Überspringen'));

    // Should now be on Taille step
    expect(screen.getByText('Taille')).toBeDefined();
  });

  it('saves measurement on confirm from summary', async () => {
    const saveSpy = vi.spyOn(dataService, 'saveWeeklyMeasurement').mockResolvedValue();
    const weekStart = dateUtils.getWeekStart(new Date());

    render(<WeeklyInputView />);
    fireEvent.click(screen.getByText('Messung starten')); // intro -> Brust

    // Enter value for Brust
    fireEvent.change(screen.getByLabelText('Brust'), { target: { value: '95.3' } });
    fireEvent.click(screen.getByText('Weiter'));

    // Enter value for Taille
    fireEvent.change(screen.getByLabelText('Taille'), { target: { value: '80.1' } });
    fireEvent.click(screen.getByText('Weiter'));

    // Skip remaining zones
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByText('Überspringen'));
    }

    // Now on summary
    expect(screen.getByText('Zusammenfassung')).toBeDefined();

    await act(async () => {
      fireEvent.click(screen.getByText('Bestätigen'));
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

  it('rounds values to one decimal on save', async () => {
    const saveSpy = vi.spyOn(dataService, 'saveWeeklyMeasurement').mockResolvedValue();

    render(<WeeklyInputView />);
    fireEvent.click(screen.getByText('Messung starten'));

    // Enter value with extra decimals for Brust
    fireEvent.change(screen.getByLabelText('Brust'), { target: { value: '95.37' } });
    fireEvent.click(screen.getByText('Weiter'));

    // Skip remaining 5 zones
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Überspringen'));
    }

    await act(async () => {
      fireEvent.click(screen.getByText('Bestätigen'));
    });

    await waitFor(() => {
      expect(screen.getByText('Gespeichert!')).toBeDefined();
    });

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        chest: 95.4,
      })
    );

    saveSpy.mockRestore();
  });

  it('back from summary returns to first zone step', () => {
    render(<WeeklyInputView />);
    fireEvent.click(screen.getByText('Messung starten'));

    // Skip all zones to reach summary
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByText('Überspringen'));
    }

    expect(screen.getByText('Zusammenfassung')).toBeDefined();
    fireEvent.click(screen.getByText('Zurück'));

    // Should be back at Brust (step 1)
    expect(screen.getByText('Brust')).toBeDefined();
    expect(screen.getByText('Messung (1/6)')).toBeDefined();
  });

  it('intro weiter button has correct data attributes', () => {
    render(<WeeklyInputView />);
    const btn = screen.getByText('Messung starten');
    expect(btn.hasAttribute('data-interactive')).toBe(true);
  });

  it('shows error for non-numeric input', () => {
    render(<WeeklyInputView />);
    fireEvent.click(screen.getByText('Messung starten'));

    fireEvent.change(screen.getByLabelText('Brust'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByText('Weiter'));

    expect(screen.getByText(/muss zwischen 10 und 200 cm liegen/)).toBeDefined();
  });

  it('shows error when trying to advance with empty input', () => {
    render(<WeeklyInputView />);
    fireEvent.click(screen.getByText('Messung starten')); // go to Brust

    fireEvent.click(screen.getByText('Weiter')); // try to advance without input
    expect(screen.getByText(/Bitte einen Wert eingeben oder überspringen/)).toBeDefined();
  });
});
