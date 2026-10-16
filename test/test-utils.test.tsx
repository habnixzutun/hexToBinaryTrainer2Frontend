import { ThemeProvider } from '../src/theme/ThemeProvider.tsx'
import { I18nProvider } from '../src/i18n/I18nContext.tsx'

describe('imports', () => {
  it('checks ThemeProvider', () => {
    expect(ThemeProvider).toBeDefined()
  })

  it('checks I18nProvider', () => {
    expect(I18nProvider).toBeDefined()
  })
})
