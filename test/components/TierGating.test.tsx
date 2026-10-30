import type { ComponentProps } from 'react'
import { render, screen, fireEvent, waitFor } from '../../src/test-utils.tsx'
import HexBinTrainer from '../../src/components/HexBinTrainer.tsx'
import UnicodeTrainer from '../../src/components/UnicodeTrainer.tsx'
import Sidebar from '../../src/components/Sidebar.tsx'
import type { ActiveApp } from '../../src/App.tsx'
import { gameApi } from '../../src/services/api.ts'
import { ApiError } from '../../src/services/apiError.ts'
import {
    CONVERSION_BIT_WIDTHS,
    UNICODE_BYTE_OPTIONS,
    bitsForBytes,
} from '../../src/constants/gameModes.ts'
import { authValue, testUser } from '../helpers/auth.ts'
// The components as text: US-39 AC-3 pins the shared module as the only place
// the width tables exist, which a runtime assertion alone cannot prove.
import hexTrainerSource from '../../src/components/HexBinTrainer.tsx?raw'
import unicodeTrainerSource from '../../src/components/UnicodeTrainer.tsx?raw'
import sidebarSource from '../../src/components/Sidebar.tsx?raw'
import appSource from '../../src/App.tsx?raw'

vi.mock('../../src/services/api.ts', () => ({
  gameApi: {
    submitAnswer: vi.fn(),
    getLeaderboard: vi.fn(),
  },
}))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../../src/contexts/AuthContext.tsx', () => ({ useAuth: mockUseAuth }))

const mockSubmitAnswer = vi.mocked(gameApi.submitAnswer)

/** The lock copy the UI must surface — the same strings translations.ts owns. */
const deLockCopy = (level: number): string => `Freigeschaltet ab Stufe ${level}.`
const enLockCopy = (level: number): string => `Unlocks at level ${level}.`

const playerAt = (level: number): void => {
  mockUseAuth.mockReturnValue(authValue({ user: { ...testUser, level } }))
}

describe('unlock gating (US-39)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    playerAt(1)
  })

  describe('conversion tiers (desktop tab bar)', () => {
    const lockedAtLevel: ReadonlyArray<[number, number[]]> = [
      [1, [8, 16, 32]],
      [3, [8, 16, 32]],
      [4, [16, 32]],
      [7, [16, 32]],
      [8, [32]],
      [12, [32]],
      [13, []],
    ]

    it.each(lockedAtLevel)(
      'level %i locks the conversion tiers %j',
      (level, locked) => {
        const { unmount } = render(<HexBinTrainer onUpdate={vi.fn()} playerLevel={level} />)
        for (const width of CONVERSION_BIT_WIDTHS) {
          const tab = screen.getByRole('tab', { name: `${width} Bits` })
          if (locked.includes(width)) {
            expect(tab).toHaveAttribute('aria-disabled', 'true')
          } else {
            expect(tab).not.toHaveAttribute('aria-disabled')
          }
        }
        unmount()
      }
    )

    it('opens a tier exactly at its min_level, not one level earlier', () => {
      const first = render(<HexBinTrainer onUpdate={vi.fn()} playerLevel={3} />)
      expect(screen.getByRole('tab', { name: '8 Bits' })).toHaveAttribute('aria-disabled', 'true')
      first.unmount()

      render(<HexBinTrainer onUpdate={vi.fn()} playerLevel={4} />)
      expect(screen.getByRole('tab', { name: '8 Bits' })).not.toHaveAttribute('aria-disabled')
    })

    it('names the required level without polluting the tab name (AC-2)', () => {
      render(<HexBinTrainer onUpdate={vi.fn()} playerLevel={1} />)

      const tab = screen.getByRole('tab', { name: '32 Bits' })
      expect(tab).toHaveAccessibleName('32 Bits')
      expect(tab).toHaveAccessibleDescription(deLockCopy(13))
      // The level is visible next to the lock glyph, not only in the description.
      expect(tab).toHaveTextContent('13')
    })

    it('ignores pointer and keyboard activation on a locked tier (AC-2)', () => {
      const onBitsChange = vi.fn()
      render(
        <HexBinTrainer
          onUpdate={vi.fn()}
          bits={4}
          onBitsChange={onBitsChange}
          playerLevel={1}
        />
      )

      const locked = screen.getByRole('tab', { name: '32 Bits' })
      fireEvent.click(locked)
      fireEvent.keyDown(locked, { key: 'Enter' })
      fireEvent.keyDown(locked, { key: ' ', code: 'Space' })

      expect(onBitsChange).not.toHaveBeenCalled()
      expect(locked).toHaveAttribute('aria-selected', 'false')
      expect(screen.getByRole('tab', { name: '4 Bits' })).toHaveAttribute('aria-selected', 'true')
    })

    it('still switches freely between the tiers a level-1 player owns', () => {
      const onBitsChange = vi.fn()
      render(
        <HexBinTrainer onUpdate={vi.fn()} bits={4} onBitsChange={onBitsChange} playerLevel={1} />
      )

      fireEvent.click(screen.getByRole('tab', { name: '4 Bits' }))
      expect(onBitsChange).toHaveBeenCalledWith(4)
    })
  })

  describe('unicode tiers (bytes in the UI, bits on the wire)', () => {
    const lockedAtLevel: ReadonlyArray<[number, number[]]> = [
      [1, [2, 3, 4]],
      [2, [3, 4]],
      [3, [4]],
      [4, []],
    ]

    it.each(lockedAtLevel)('level %i locks the byte tiers %j', (level, locked) => {
      const { unmount } = render(<UnicodeTrainer onUpdate={vi.fn()} playerLevel={level} />)
      for (const bytes of UNICODE_BYTE_OPTIONS) {
        const tab = screen.getByRole('tab', { name: `${bytes} ${bytes === 1 ? 'Byte' : 'Bytes'}` })
        if (locked.includes(bytes)) {
          expect(tab).toHaveAttribute('aria-disabled', 'true')
        } else {
          expect(tab).not.toHaveAttribute('aria-disabled')
        }
      }
      unmount()
    })

    it('gates the byte option by the level its bit width needs (OQ-7)', () => {
      render(<UnicodeTrainer onUpdate={vi.fn()} playerLevel={1} />)

      // 3 bytes == 24 bits == min_level 3.
      const tab = screen.getByRole('tab', { name: '3 Bytes' })
      expect(tab).toHaveAccessibleName('3 Bytes')
      expect(tab).toHaveAccessibleDescription(deLockCopy(3))
      expect(bitsForBytes(3)).toBe(24)
    })

    it('ignores pointer and keyboard activation on a locked byte tier (AC-2)', () => {
      const onBytesChange = vi.fn()
      render(
        <UnicodeTrainer onUpdate={vi.fn()} bytes={1} onBytesChange={onBytesChange} playerLevel={1} />
      )

      const locked = screen.getByRole('tab', { name: '4 Bytes' })
      fireEvent.click(locked)
      fireEvent.keyDown(locked, { key: 'Enter' })

      expect(onBytesChange).not.toHaveBeenCalled()
      expect(locked).toHaveAttribute('aria-selected', 'false')
      expect(screen.getByRole('tab', { name: '1 Byte' })).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('mobile selectors (Sidebar -> BitByteSelector)', () => {
    const sidebarProps = (
      overrides: Partial<ComponentProps<typeof Sidebar>> = {}
    ): ComponentProps<typeof Sidebar> => ({
      activeApp: 'hex',
      setActiveApp: vi.fn(),
      isMobileMenuOpen: false,
      setIsMobileMenuOpen: vi.fn(),
      hideLeaderboardNav: false,
      isMobile: true,
      activeHexMode: 'HexToBin',
      onHexModeChange: vi.fn(),
      bits: 4,
      onBitsChange: vi.fn(),
      bytes: 1,
      onBytesChange: vi.fn(),
      ...overrides,
    })

    it('locks the bit widths the profile has not reached', () => {
      const onBitsChange = vi.fn()
      render(
        <Sidebar
          {...sidebarProps({ onBitsChange })}
          bits={4}
        />
      )

      expect(screen.getByRole('button', { name: '4 Bits' })).not.toHaveAttribute('aria-disabled')
      const locked = screen.getByRole('button', { name: '16 Bits' })
      expect(locked).toHaveAttribute('aria-disabled', 'true')
      expect(locked).toHaveAccessibleDescription(deLockCopy(8))

      fireEvent.click(locked)
      expect(onBitsChange).not.toHaveBeenCalled()
    })

    it('locks the byte options by their bit width', () => {
      render(<Sidebar {...sidebarProps({ activeApp: 'unicode' as ActiveApp })} />)

      const locked = screen.getByRole('button', { name: '2 Bytes' })
      expect(locked).toHaveAttribute('aria-disabled', 'true')
      expect(locked).toHaveAccessibleDescription(deLockCopy(2))
      expect(screen.getByRole('button', { name: '1 Byte' })).not.toHaveAttribute('aria-disabled')
    })

    it('gates nothing while the profile is missing', () => {
      mockUseAuth.mockReturnValue(authValue({ user: null }))
      render(<Sidebar {...sidebarProps()} />)

      for (const width of CONVERSION_BIT_WIDTHS) {
        expect(screen.getByRole('button', { name: `${width} Bits` })).not.toHaveAttribute(
          'aria-disabled'
        )
      }
    })

    it('opens every tier once the cap level is reached', () => {
      playerAt(13)
      render(<Sidebar {...sidebarProps()} />)

      for (const width of CONVERSION_BIT_WIDTHS) {
        expect(screen.getByRole('button', { name: `${width} Bits` })).not.toHaveAttribute(
          'aria-disabled'
        )
      }
    })
  })

  describe('server authority on a 403 (AC-4)', () => {
    const answerLockedToLevel13 = (): void => {
      mockSubmitAnswer.mockRejectedValue(
        new ApiError({ status: 403, detail: 'Content locked until level 13' })
      )
    }

    const submitAnAnswer = async (): Promise<void> => {
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '10000111' } })
      fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    }

    it('refreshes the profile and shows the hint instead of dead-ending', async () => {
      answerLockedToLevel13()
      const onUpdate = vi.fn()
      render(<HexBinTrainer onUpdate={onUpdate} playerLevel={13} />)

      await submitAnAnswer()

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledTimes(1)
      })
      expect(screen.getByRole('alert')).toHaveTextContent(deLockCopy(13))
    })

    it('surfaces the same hint in English (AC-5, both locales)', async () => {
      localStorage.setItem('locale', 'en')
      answerLockedToLevel13()
      const onUpdate = vi.fn()
      render(<HexBinTrainer onUpdate={onUpdate} playerLevel={13} />)

      await submitAnAnswer()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(enLockCopy(13))
      })
      expect(onUpdate).toHaveBeenCalledTimes(1)
    })

    it('keeps the profile refresh reserved for the locked case', async () => {
      mockSubmitAnswer.mockRejectedValue(new TypeError('Network error'))
      const onUpdate = vi.fn()
      render(<HexBinTrainer onUpdate={onUpdate} playerLevel={13} />)

      await submitAnAnswer()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Fehler beim Speichern/i)
      })
      expect(onUpdate).not.toHaveBeenCalled()
    })
  })

  describe('single source of truth (AC-3)', () => {
    const sources: ReadonlyArray<readonly [string, string]> = [
      ['HexBinTrainer.tsx', hexTrainerSource],
      ['UnicodeTrainer.tsx', unicodeTrainerSource],
      ['Sidebar.tsx', sidebarSource],
      ['App.tsx', appSource],
    ]

    /** The pre-US-39 local copies. `UNICODE_BYTE_OPTIONS` must not trip this. */
    const LOCAL_COPY = /(?<![A-Z_])(?:BIT_OPTIONS|BYTE_OPTIONS)(?![A-Z_])/

    it('leaves no width table outside the shared module', () => {
      for (const [name, source] of sources) {
        const compact = source.replace(/\s+/g, '')
        expect(compact, name).not.toContain('[4,8,16,32]')
        expect(compact, name).not.toContain('[8,16,24,32]')
        expect(compact, name).not.toContain('[1,2,3,4]')
        expect(LOCAL_COPY.test(compact), name).toBe(false)
      }
    })

    it('keeps the x8 arithmetic in the shared module alone', () => {
      for (const [name, source] of sources) {
        expect(source.replace(/\s+/g, ''), name).not.toContain('*8')
      }
    })

    it('reads the tables from src/constants/gameModes.ts', () => {
      for (const [name, source] of sources) {
        expect(source, name).toMatch(/from '\.\.?\/constants\/gameModes\.ts'/)
      }
    })

    it('renders exactly the shared tier lists once everything is unlocked', () => {
      const bits = render(<HexBinTrainer onUpdate={vi.fn()} playerLevel={99} />)
      expect(screen.getAllByRole('tab').map((tab) => tab.textContent?.trim())).toEqual(
        CONVERSION_BIT_WIDTHS.map((width) => `${width} Bits`)
      )
      bits.unmount()

      render(<UnicodeTrainer onUpdate={vi.fn()} playerLevel={99} />)
      expect(screen.getAllByRole('tab').map((tab) => tab.textContent?.trim())).toEqual(
        UNICODE_BYTE_OPTIONS.map((bytes) => `${bytes} ${bytes === 1 ? 'Byte' : 'Bytes'}`)
      )
    })
  })
})
