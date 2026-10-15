import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

describe('Test Infrastructure', () => {
  it('renders a simple component', () => {
    render(<div data-testid="test">Hello World</div>)
    expect(screen.getByTestId('test')).toBeInTheDocument()
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
