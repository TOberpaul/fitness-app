import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import WeeklyInputView from './WeeklyInputView';
import { resetDB } from '../services/db';
import * as dataService from '../services/dataService';
import * as dateUtils from '../utils/date';

// Mock motion/react so AnimatePresence and motion.div render synchronously in tests
vi.mock('motion/react', async () => {
  const React = await import('react');
  return {
    motion: new Proxy({}, {
      get: (_target: unknown, prop: string) => {
        const MotionComponent = (props: Record<string, unknown>) => {
          const motionKeys = new Set(['variants', 'initial', 'animate', 'exit', 'whileTap', 'whileHover',
            'layout', 'layoutId', 'custom', 'onAnimationComplete', 'transition']);
          const filtered: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(props)) {
            if (!motionKeys.has(key)) filtered[key] = value;
          }
          return React.createElement(prop, filtered);
        };
        MotionComponent.displayName = `motion.${prop}`;
        return MotionComponent;
      },
    }),
    AnimatePresence: ({ children }: { children: unknown }) => children,
    useReducedMotion: () => false,
  };
});

beforeEach(() => {
  resetDB();
  indexedDB.deleteDatabase('fitness-tracker');
});

const noop = () => {}

describe('WeeklyInputView', () => {
  it('renders first zone step when open', () => {
    render(<WeeklyInputView open onClose={noop} />);
    expect(screen.getByText('Brust')).toBeDefined();
    expect(screen.getByText('Messung (1/6)')).toBeDefined();
  });

  it('shows all zone steps in correct order', () => {
    const zones = ['Brust', 'Taille', 'Bauch', 'Hüfte', 'Oberarm', 'Oberschenkel'];
    render(<WeeklyInputView open onClose={noop} />);

    for (let i = 0; i < zones.length; i++) {
      expect(screen.getByText(zones[i])).toBeDefined();
      expect(screen.getByText(`Messung (${i + 1}/6)`)).toBeDefined();
      fireEvent.click(screen.getByText('Überspringen'));
    }
    expect(screen.getByText('Zusammenfassung')).toBeDefined();
  });

  it('validates input on next and shows error', () => {
    render(<WeeklyInputView open onClose={noop} />);

    const input = screen.getByLabelText('Brust');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByText('Weiter'));

    expect(screen.getByText(/muss zwischen 10 und 200 cm liegen/)).toBeDefined();
  });

  it('clears error when input changes', () => {
    render(<WeeklyInputView open onClose={noop} />);

    const input = screen.getByLabelText('Brust');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByText('Weiter'));
    expect(screen.getByText(/muss zwischen/)).toBeDefined();

    const inputAfterError = screen.getByLabelText('Brust');
    fireEvent.change(inputAfterError, { target: { value: '90' } });
    expect(screen.queryByText(/muss zwischen/)).toBeNull();
  });

  it('advances to next step on valid input', () => {
    render(<WeeklyInputView open onClose={noop} />);

    const input = screen.getByLabelText('Brust');
    fireEvent.change(input, { target: { value: '95.3' } });
    fireEvent.click(screen.getByText('Weiter'));

    expect(screen.getByText('Taille')).toBeDefined();
    expect(screen.getByText('Messung (2/6)')).toBeDefined();
  });

  it('skip advances without recording a value', () => {
    render(<WeeklyInputView open onClose={noop} />);
    fireEvent.click(screen.getByText('Überspringen'));

    expect(screen.getByText('Taille')).toBeDefined();
  });

  it('saves measurement on confirm from summary', async () => {
    const saveSpy = vi.spyOn(dataService, 'saveWeeklyMeasurement').mockResolvedValue();
    const weekStart = dateUtils.getWeekStart(new Date());

    render(<WeeklyInputView open onClose={noop} />);

    fireEvent.change(screen.getByLabelText('Brust'), { target: { value: '95.3' } });
    fireEvent.click(screen.getByText('Weiter'));

    fireEvent.change(screen.getByLabelText('Taille'), { target: { value: '80.1' } });
    fireEvent.click(screen.getByText('Weiter'));

    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByText('Überspringen'));
    }

    expect(screen.getByText('Zusammenfassung')).toBeDefined();

    await act(async () => {
      fireEvent.click(screen.getByText('Bestätigen'));
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

    render(<WeeklyInputView open onClose={noop} />);

    fireEvent.change(screen.getByLabelText('Brust'), { target: { value: '95.37' } });
    fireEvent.click(screen.getByText('Weiter'));

    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Überspringen'));
    }

    await act(async () => {
      fireEvent.click(screen.getByText('Bestätigen'));
    });

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        chest: 95.4,
      })
    );

    saveSpy.mockRestore();
  });

  it('back from summary returns to first zone step', () => {
    render(<WeeklyInputView open onClose={noop} />);

    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByText('Überspringen'));
    }

    expect(screen.getByText('Zusammenfassung')).toBeDefined();
    fireEvent.click(screen.getByText('Zurück'));

    expect(screen.getByText('Brust')).toBeDefined();
    expect(screen.getByText('Messung (1/6)')).toBeDefined();
  });

  it('shows error for non-numeric input', () => {
    render(<WeeklyInputView open onClose={noop} />);

    fireEvent.change(screen.getByLabelText('Brust'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByText('Weiter'));

    expect(screen.getByText(/muss zwischen 10 und 200 cm liegen/)).toBeDefined();
  });

  it('shows error when trying to advance with empty input', () => {
    render(<WeeklyInputView open onClose={noop} />);

    fireEvent.click(screen.getByText('Weiter'));
    expect(screen.getByText(/Bitte einen Wert eingeben oder überspringen/)).toBeDefined();
  });
});
