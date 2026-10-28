// Test-only helper: the dev server never loads this file, so HMR validity is
// meaningless here and `export *` from testing-library cannot be verified.
/* eslint-disable react-refresh/only-export-components */
import { render, type RenderOptions } from '@testing-library/react'
import { ThemeProvider } from './theme/ThemeProvider.tsx'
import { I18nProvider } from './i18n/I18nContext.tsx'

// Test wrapper with all required providers
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        {children}
      </I18nProvider>
    </ThemeProvider>
  )
}

// Custom render function that includes all providers
function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export everything from testing-library
export * from '@testing-library/react'

// Override render with our custom version
export { renderWithProviders as render }
