import { translations, type Locale, type Translations } from '../../src/i18n/translations.ts'
import { GAME_MODES } from '../../src/constants/gameModes.ts'

const LOCALES: readonly Locale[] = ['de', 'en']
const copy = (locale: Locale): Translations => translations[locale]

describe('translations', () => {
  it('keeps both locales structurally identical', () => {
    const deKeys = Object.keys(copy('de')).sort()
    for (const locale of LOCALES) {
      expect(Object.keys(copy(locale)).sort()).toEqual(deKeys)
    }
  })

  it('holds no empty or undefined copy entries', () => {
    // modeNames is a nested record, so the walk descends instead of stopping at the leaf.
    const walk = (locale: Locale, path: string, node: Record<string, unknown>): void => {
      for (const [key, value] of Object.entries(node)) {
        const at = `${path}.${key}`
        expect(value, at).not.toBeNull()
        if (typeof value === 'object' && value !== null) {
          walk(locale, at, value as Record<string, unknown>)
          continue
        }
        expect(typeof value === 'string' ? value.trim().length > 0 : typeof value === 'function', at).toBe(true)
      }
    }

    for (const locale of LOCALES) {
      walk(locale, locale, copy(locale) as unknown as Record<string, unknown>)
    }
  })

  it('carries the XP-economy copy the leaderboard, sidebar and toast need', () => {
    // US-45 deleted the HUD bar: hudLabel, streak, bestStreak and xpProgress went
    // with it. These are the economy keys that must still exist.
    for (const locale of LOCALES) {
      const t = copy(locale)

      expect(t.levelLabel.length).toBeGreaterThan(0)
      expect(t.xp).toBe('XP')
      expect(t.dismissNotice.length).toBeGreaterThan(0)
      expect(t.leaderboardError.length).toBeGreaterThan(0)
    }
  })

  it('drops the HUD-only copy with the HUD bar (US-45)', () => {
    for (const locale of LOCALES) {
      const keys = Object.keys(copy(locale))

      expect(keys).not.toContain('hudLabel')
      expect(keys).not.toContain('streak')
      expect(keys).not.toContain('bestStreak')
      expect(keys).not.toContain('xpProgress')
    }
  })

  it('interpolates the numbers the toast and the error paths need', () => {
    expect(copy('de').levelUpToast(8)).toContain('8')
    expect(copy('en').levelUpToast(8)).toContain('8')
    expect(copy('de').lockedUntilLevel(13)).toContain('13')
    expect(copy('en').lockedUntilLevel(13)).toContain('13')
    expect(copy('de').rateLimited(25)).toContain('25')
    expect(copy('en').rateLimited(25)).toContain('25')
  })

  it('names the level in the local language', () => {
    expect(copy('de').levelUpToast(6)).toMatch(/Stufe 6/)
    expect(copy('en').levelUpToast(6)).toMatch(/Level 6/)
  })

  it('names every backend mode the answer endpoint accepts', () => {
    for (const locale of LOCALES) {
      const names = copy(locale).modeNames
      expect(Object.keys(names).sort()).toEqual([...GAME_MODES].sort())
      for (const mode of GAME_MODES) {
        expect(names[mode].length).toBeGreaterThan(0)
      }
    }
  })
})
