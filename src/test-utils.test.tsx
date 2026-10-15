import { ThemeProvider } from './theme/ThemeProvider'
import { I18nProvider } from './i18n/I18nContext.tsx'

describe('imports', () => {
  it('checks ThemeProvider', () => {
    expect(ThemeProvider).toBeDefined()
  })

  it('checks I18nProvider', () => {
    expect(I18nProvider).toBeDefined()
  })
})
