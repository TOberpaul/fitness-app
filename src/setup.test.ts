import { describe, it, expect } from 'vitest'

describe('Project Setup', () => {
  it('should have vitest configured with jsdom', () => {
    expect(typeof document).toBe('object')
    expect(document.createElement).toBeDefined()
  })

  it('should run basic assertions', () => {
    expect(1 + 1).toBe(2)
  })
})
