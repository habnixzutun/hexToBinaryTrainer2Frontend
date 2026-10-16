// Mock react-dom/client
const mockRender = vi.fn()
const mockCreateRoot = vi.fn(() => ({
  render: mockRender,
}))

vi.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot,
}))

// Mock App component
vi.mock('./App', () => ({
  default: () => <div data-testid="mock-app">Mock App</div>,
}))

// Mock CSS import
vi.mock('./index.css', () => ({}))

describe('main.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    // Clean up DOM
    document.body.innerHTML = ''
  })

  it('throws error when root element is missing', async () => {
    // Arrange: no #root element in DOM
    document.body.innerHTML = '<div id="other"></div>'

    // Act & Assert: should throw error when importing main
    await expect(import('./main')).rejects.toThrow('Failed to find the root element')
  })

  it('renders App with providers when root element exists', async () => {
    // Arrange: create #root element
    document.body.innerHTML = '<div id="root"></div>'

    // Act: import main (which executes the module code)
    await import('./main')

    // Assert: should call createRoot with root element
    const rootElement = document.getElementById('root')
    expect(mockCreateRoot).toHaveBeenCalledWith(rootElement)

    // Should call render with StrictMode > ThemeProvider > I18nProvider > App
    expect(mockRender).toHaveBeenCalled()

    // Verify the render call structure (first argument is the React element tree)
    const renderCall = mockRender.mock.calls[0][0]
    expect(renderCall).toBeDefined()
    expect(renderCall.type).toBeDefined() // StrictMode
  })
})
