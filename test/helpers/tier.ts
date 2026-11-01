import { screen } from '../../src/test-utils.tsx'

/**
 * The tier the desktop tab bar currently has selected, read off
 * `aria-selected` — the only thing outside the component that can see an
 * internal default (US-46).
 *
 * Lives in a helper because both US-46 suites need it and a copy drifting by
 * one attribute is a test that silently asserts nothing.
 *
 * @throws when the tab bar does not select exactly one tier.
 */
export function selectedTier(): number {
  const selected = screen
    .getAllByRole('tab')
    .filter((tab) => tab.getAttribute('aria-selected') === 'true')

  expect(selected, 'exactly one tier is selected').toHaveLength(1)

  const [tab] = selected
  if (tab === undefined) {
    throw new Error('no selected tier tab')
  }

  // aria-label is `${bits} ${t.bits}` — the number is what the wire carries.
  return Number(tab.getAttribute('aria-label')?.split(' ')[0])
}

/**
 * The question currently on screen, scoped to `#source-value`.
 *
 * A bare `screen.getByText('8')` is not usable here: at 4 bits the question is
 * "8" and the 16-bit tier's lock badge renders the same digit, so an
 * unscoped query matches two nodes and the assertion tells you nothing about
 * which one it hit (US-46).
 */
export function questionText(): string {
  const source = document.getElementById('source-value')
  if (source === null) {
    throw new Error('no #source-value element — the trainer did not render')
  }
  return source.textContent?.trim() ?? ''
}
