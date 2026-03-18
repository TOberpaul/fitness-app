import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import fc from 'fast-check'
import AchievementSection, { sortAchievements } from '../AchievementSection'
import type { Achievement, AchievementDefinition, AchievementStatus, AchievementCategory, MilestoneType } from '../../types'

const milestoneIds: MilestoneType[] = [
  'weight-loss-2kg',
  'weight-loss-5kg',
  'weight-loss-10kg',
  'first-goal-reached',
  'daily-streak-7',
  'daily-streak-30',
  'weekly-streak-3',
  'weekly-streak-10',
]

const achievementDefArb = fc.record({
  id: fc.constantFrom(...milestoneIds),
  label: fc.string({ minLength: 1, maxLength: 30 }),
  category: fc.constantFrom('progress' as AchievementCategory, 'streak' as AchievementCategory),
  icon: fc.constantFrom('🏋️', '💪', '🏆', '🎯', '🔥', '📏'),
}) as fc.Arbitrary<AchievementDefinition>

const earnedDateArb = fc.integer({ min: 0, max: 730 }).map((offset) => {
  const d = new Date(2024, 0, 1)
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
})

const achievementArb: fc.Arbitrary<Achievement> = fc.record({
  definition: achievementDefArb,
  status: fc.constantFrom('earned' as AchievementStatus, 'locked' as AchievementStatus),
}).chain((base) => {
  if (base.status === 'earned') {
    return earnedDateArb.map((earnedAt) => ({
      ...base,
      earnedAt,
    }))
  }
  return fc.constant(base)
})

// Generate lists with unique definition IDs
const achievementListArb = fc
  .uniqueArray(achievementArb, { comparator: (a, b) => a.definition.id === b.definition.id, minLength: 1, maxLength: 8 })

function makeAchievement(
  id: MilestoneType,
  label: string,
  category: AchievementCategory,
  status: AchievementStatus,
  earnedAt?: string
): Achievement {
  return {
    definition: { id, label, category, icon: '🏆' },
    status,
    ...(earnedAt ? { earnedAt } : {}),
  }
}

describe('AchievementSection', () => {
  // --- Unit Tests ---

  it('renders only progress and streak achievements (Req 4.1, 4.2)', () => {
    const achievements: Achievement[] = [
      makeAchievement('weight-loss-5kg', '5 kg verloren', 'progress', 'earned', '2025-01-15'),
      makeAchievement('daily-streak-7', '7 Tage eingetragen', 'streak', 'locked'),
    ]
    const { container } = render(<AchievementSection achievements={achievements} streaks={null} />)
    const cards = container.querySelectorAll('.achievement-card')
    expect(cards.length).toBe(2)
  })

  it('renders earned achievements before locked ones (Req 4.6)', () => {
    const achievements: Achievement[] = [
      makeAchievement('daily-streak-7', '7 Tage eingetragen', 'streak', 'locked'),
      makeAchievement('weight-loss-5kg', '5 kg verloren', 'progress', 'earned', '2025-01-15'),
      makeAchievement('weight-loss-2kg', '2 kg verloren', 'progress', 'locked'),
    ]
    const { container } = render(<AchievementSection achievements={achievements} streaks={null} />)
    const cards = container.querySelectorAll('.achievement-card')
    expect(cards[0].getAttribute('data-status')).toBe('earned')
    expect(cards[1].getAttribute('data-status')).toBe('locked')
    expect(cards[2].getAttribute('data-status')).toBe('locked')
  })

  it('shows checkmark or image for earned and lock for locked (Req 4.4)', () => {
    const achievements: Achievement[] = [
      makeAchievement('weight-loss-5kg', '5 kg verloren', 'progress', 'earned', '2025-01-15'),
      makeAchievement('daily-streak-7', '7 Tage eingetragen', 'streak', 'locked'),
    ]
    const { container } = render(<AchievementSection achievements={achievements} streaks={null} />)
    const earnedIcon = container.querySelector('[data-testid="achievement-icon-earned"]')
    const lockedIcon = container.querySelector('[data-testid="achievement-icon-locked"]')
    expect(earnedIcon).not.toBeNull()
    expect(lockedIcon?.textContent).toBe('🔒')
  })

  it('renders compact cards without body text (Req 4.3)', () => {
    const achievements: Achievement[] = [
      makeAchievement('weight-loss-5kg', '5 kg verloren', 'progress', 'earned', '2025-01-15'),
    ]
    const { container } = render(<AchievementSection achievements={achievements} streaks={null} />)
    // Should have label but detail should be short date, not body text
    const labels = container.querySelectorAll('.achievement-card-label')
    expect(labels.length).toBe(1)
    expect(labels[0].textContent).toBe('5 kg verloren')
  })

  it('renders nothing when achievements list is empty', () => {
    const { container } = render(<AchievementSection achievements={[]} />)
    expect(container.querySelector('[data-testid="achievement-section"]')).toBeNull()
  })

  it('uses Section component with title', () => {
    const achievements: Achievement[] = [
      makeAchievement('weight-loss-5kg', '5 kg verloren', 'progress', 'earned', '2025-01-15'),
    ]
    const { container } = render(<AchievementSection achievements={achievements} streaks={null} />)
    const section = container.querySelector('.core-section')
    expect(section).not.toBeNull()
    const title = container.querySelector('.core-section-title')
    expect(title?.textContent).toBe('Achievements')
  })

  it('applies violet data-color for earned achievements', () => {
    const achievements: Achievement[] = [
      makeAchievement('weight-loss-5kg', '5 kg verloren', 'progress', 'earned', '2025-01-15'),
    ]
    const { container } = render(<AchievementSection achievements={achievements} streaks={null} />)
    const iconArea = container.querySelector('.achievement-card-icon-area')
    expect(iconArea?.getAttribute('data-color')).toBe('violet')
  })

  it('does not apply data-color for locked achievements', () => {
    const achievements: Achievement[] = [
      makeAchievement('daily-streak-7', '7 Tage eingetragen', 'streak', 'locked'),
    ]
    const { container } = render(<AchievementSection achievements={achievements} streaks={null} />)
    const iconArea = container.querySelector('.achievement-card-icon-area')
    expect(iconArea?.hasAttribute('data-color')).toBe(false)
  })

  // --- Property-Based Tests ---

  // Feature: gamification-restructure, Property 12: Achievement-Sortierung
  // **Validates: Requirements 4.6**
  it('P12: earned achievements always appear before locked achievements', () => {
    fc.assert(
      fc.property(achievementListArb, (achievements) => {
        const sorted = sortAchievements(achievements)
        let seenLocked = false
        for (const a of sorted) {
          if (a.status === 'locked') {
            seenLocked = true
          }
          if (a.status === 'earned' && seenLocked) {
            return false // earned after locked = violation
          }
        }
        return true
      }),
      { numRuns: 100 }
    )
  })

  // Feature: gamification-restructure, Property 13: Achievement-Icon entspricht Status
  // **Validates: Requirements 4.4**
  it('P13: earned shows icon, locked shows lock icon', () => {
    fc.assert(
      fc.property(achievementArb, (achievement) => {
        const achievements = [achievement]
        const { container } = render(<AchievementSection achievements={achievements} streaks={null} />)

        if (achievement.status === 'earned') {
          const earnedIcon = container.querySelector('[data-testid="achievement-icon-earned"]')
          const result = earnedIcon !== null
          container.remove()
          return result
        } else {
          const lockedIcon = container.querySelector('[data-testid="achievement-icon-locked"]')
          const result = lockedIcon?.textContent === '🔒'
          container.remove()
          return result
        }
      }),
      { numRuns: 100 }
    )
  })
})
