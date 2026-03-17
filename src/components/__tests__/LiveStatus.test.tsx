import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import fc from 'fast-check'
import LiveStatus from '../LiveStatus'
import type { GoalProjection, ConsistencyScore, MicroWin } from '../../types'

const baseProjection: GoalProjection = {
  currentValue: 80,
  remainingDistance: 5,
  percentComplete: 66,
  requiredWeeklyTempo: -0.5,
  projectedDate: '2025-09-01',
  currentWeeklyRate: -0.4,
  trendFeedback: 'on-track',
}

const baseConsistency: ConsistencyScore = {
  weekStart: '2025-01-06',
  daysLogged: 5,
  weeklyCompleted: true,
  score: 85,
}

describe('LiveStatus', () => {
  // --- Unit Tests ---

  it('shows "auf Kurs" when trend is on-track', () => {
    render(<LiveStatus projection={{ ...baseProjection, trendFeedback: 'on-track' }} consistencyScore={null} microWins={[]} />)
    expect(screen.getByText('auf Kurs')).toBeDefined()
  })

  it('shows "leicht voraus" when trend is ahead', () => {
    render(<LiveStatus projection={{ ...baseProjection, trendFeedback: 'ahead' }} consistencyScore={null} microWins={[]} />)
    expect(screen.getByText('leicht voraus')).toBeDefined()
  })

  it('shows "hinter Plan" when trend is behind', () => {
    render(<LiveStatus projection={{ ...baseProjection, trendFeedback: 'behind' }} consistencyScore={null} microWins={[]} />)
    expect(screen.getByText('hinter Plan')).toBeDefined()
  })

  it('shows "Noch nicht genug Daten" when trend is insufficient-data', () => {
    render(<LiveStatus projection={{ ...baseProjection, trendFeedback: 'insufficient-data' }} consistencyScore={null} microWins={[]} />)
    expect(screen.getByText('Noch nicht genug Daten')).toBeDefined()
  })

  it('shows "Noch nicht genug Daten" when projection is null (Req 2.5)', () => {
    render(<LiveStatus projection={null} consistencyScore={null} microWins={[]} />)
    expect(screen.getByText('Noch nicht genug Daten')).toBeDefined()
  })

  it('renders consistency score as Notification (Req 2.3)', () => {
    render(<LiveStatus projection={null} consistencyScore={baseConsistency} microWins={[]} />)
    expect(screen.getByText('Konsistenz: 85%')).toBeDefined()
  })

  it('applies green data-color for high consistency score', () => {
    const { container } = render(<LiveStatus projection={null} consistencyScore={{ ...baseConsistency, score: 90 }} microWins={[]} />)
    const notification = container.querySelector('.core-notification')
    expect(notification?.getAttribute('data-color')).toBe('green')
  })

  it('applies yellow data-color for medium consistency score', () => {
    const { container } = render(<LiveStatus projection={null} consistencyScore={{ ...baseConsistency, score: 60 }} microWins={[]} />)
    const notification = container.querySelector('.core-notification')
    expect(notification?.getAttribute('data-color')).toBe('yellow')
  })

  it('applies red data-color for low consistency score', () => {
    const { container } = render(<LiveStatus projection={null} consistencyScore={{ ...baseConsistency, score: 30 }} microWins={[]} />)
    const notification = container.querySelector('.core-notification')
    expect(notification?.getAttribute('data-color')).toBe('red')
  })

  it('renders micro-wins as short texts (Req 2.2, 7.3)', () => {
    const wins: MicroWin[] = [
      { text: '−0.6% Körperfett', metric: 'bodyFat' },
      { text: '−1.2 cm Taille', metric: 'waist' },
    ]
    render(<LiveStatus projection={null} consistencyScore={null} microWins={wins} />)
    expect(screen.getByText('−0.6% Körperfett')).toBeDefined()
    expect(screen.getByText('−1.2 cm Taille')).toBeDefined()
  })

  it('does not render micro-wins section when empty', () => {
    const { container } = render(<LiveStatus projection={null} consistencyScore={null} microWins={[]} />)
    expect(container.querySelector('.live-status-micro-wins')).toBeNull()
  })

  it('does not contain achievement cards or milestone info (Req 2.4)', () => {
    const wins: MicroWin[] = [{ text: '−0.6% Körperfett', metric: 'bodyFat' }]
    const { container } = render(<LiveStatus projection={baseProjection} consistencyScore={baseConsistency} microWins={wins} />)
    expect(container.querySelector('.achievement-card')).toBeNull()
    expect(screen.queryByText(/Meilenstein/)).toBeNull()
    expect(screen.queryByText(/Achievement/)).toBeNull()
  })

  it('uses .adaptive class on root element', () => {
    const { container } = render(<LiveStatus projection={null} consistencyScore={null} microWins={[]} />)
    const root = container.querySelector('.live-status')
    expect(root?.classList.contains('adaptive')).toBe(true)
  })

  it('uses data-trend attribute on trend text', () => {
    const { container } = render(<LiveStatus projection={{ ...baseProjection, trendFeedback: 'behind' }} consistencyScore={null} microWins={[]} />)
    const trendEl = container.querySelector('.live-status-trend')
    expect(trendEl?.getAttribute('data-trend')).toBe('behind')
  })

  // --- Property-Based Test: Property 14 ---

  // Feature: gamification-restructure, Property 14: Trend-Feedback-Text-Zuordnung
  // **Validates: Requirements 2.1, 2.5**
  it('P14: maps all trendFeedback values to correct German text', () => {
    const trendMapping: Record<string, string> = {
      ahead: 'leicht voraus',
      'on-track': 'auf Kurs',
      behind: 'hinter Plan',
      'insufficient-data': 'Noch nicht genug Daten',
    }

    const trendArb = fc.oneof(
      fc.constant('ahead' as const),
      fc.constant('on-track' as const),
      fc.constant('behind' as const),
      fc.constant('insufficient-data' as const)
    )

    fc.assert(
      fc.property(trendArb, (trend) => {
        const projection: GoalProjection = {
          ...baseProjection,
          trendFeedback: trend,
        }
        const { container } = render(<LiveStatus projection={projection} consistencyScore={null} microWins={[]} />)
        const trendEl = container.querySelector('.live-status-trend')
        const displayedText = trendEl?.textContent ?? ''
        const expectedText = trendMapping[trend]

        // Cleanup for next iteration
        container.remove()

        return displayedText === expectedText
      }),
      { numRuns: 100 }
    )
  })

  it('P14: null projection maps to "Noch nicht genug Daten"', () => {
    const { container } = render(<LiveStatus projection={null} consistencyScore={null} microWins={[]} />)
    const trendEl = container.querySelector('.live-status-trend')
    expect(trendEl?.textContent).toBe('Noch nicht genug Daten')
  })
})
