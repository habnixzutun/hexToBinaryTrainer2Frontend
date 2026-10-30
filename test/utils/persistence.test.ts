import { isPersistenceEnabled, persistItem, setPersistenceEnabled } from '../../src/utils/persistence.ts'

describe('persistence switch', () => {
  beforeEach(() => {
    localStorage.clear()
    setPersistenceEnabled(true)
  })

  afterEach(() => {
    setPersistenceEnabled(true)
  })

  it('writes to localStorage by default', () => {
    persistItem('theme', 'light')

    expect(isPersistenceEnabled()).toBe(true)
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('skips writes while persistence is disabled (guest mode)', () => {
    setPersistenceEnabled(false)
    persistItem('theme', 'light')

    expect(isPersistenceEnabled()).toBe(false)
    expect(localStorage.getItem('theme')).toBeNull()
  })

  it('does not throw when localStorage is unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => persistItem('theme', 'light')).not.toThrow()
    spy.mockRestore()
  })
})
