import { act, fireEvent, render, screen, within } from '../../src/test-utils.tsx'
import LevelUpToast, { TOAST_AUTO_DISMISS_MS } from '../../src/components/LevelUpToast.tsx'
import type { UnlockEntry } from '../../src/services/api.ts'

/** D-2 seed shape: L8 opens the 16-bit conversion and the 24-bit unicode tier. */
const twoUnlocks: readonly UnlockEntry[] = [
  { mode: 'hex_to_bin', bit_width: 16, min_level: 8 },
  { mode: 'unicode', bit_width: 24, min_level: 8 },
]

describe('LevelUpToast', () => {
  const onDismiss = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stays a no-op when the level-up carried no unlock (AC-2)', () => {
    const { container } = render(<LevelUpToast level={6} unlocks={[]} onDismiss={onDismiss} />)

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryAllByRole('status')).toHaveLength(0)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('announces the level and lists every unlock with its wire width', () => {
    render(<LevelUpToast level={8} unlocks={twoUnlocks} onDismiss={onDismiss} />)

    const toast = screen.getByRole('status')
    expect(toast).toHaveAccessibleName(/Stufe 8/)
    expect(within(toast).getByText('16 Bits')).toBeInTheDocument()
    expect(within(toast).getByText('24 Bits')).toBeInTheDocument()
    expect(within(toast).getByText(/Unicode/)).toBeInTheDocument()
  })

  it('dismisses through the close button', () => {
    render(<LevelUpToast level={8} unlocks={twoUnlocks} onDismiss={onDismiss} />)

    fireEvent.click(screen.getByRole('button', { name: 'Hinweis ausblenden' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('auto-dismisses after the bounded dwell time', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    render(<LevelUpToast level={8} unlocks={twoUnlocks} onDismiss={onDismiss} />)

    act(() => {
      vi.advanceTimersByTime(TOAST_AUTO_DISMISS_MS - 1)
    })
    expect(onDismiss).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('cancels its pending timer when it unmounts early', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { unmount } = render(<LevelUpToast level={8} unlocks={twoUnlocks} onDismiss={onDismiss} />)

    unmount()
    act(() => {
      vi.advanceTimersByTime(TOAST_AUTO_DISMISS_MS + 1_000)
    })

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('speaks English when the locale is en', () => {
    localStorage.setItem('locale', 'en')
    render(<LevelUpToast level={8} unlocks={twoUnlocks} onDismiss={onDismiss} />)

    expect(screen.getByRole('status')).toHaveAccessibleName(/Level 8/)
    expect(screen.getByRole('button', { name: 'Dismiss notice' })).toBeInTheDocument()
  })
})
