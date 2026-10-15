import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock framer-motion globally for all tests to avoid animation delays
vi.mock('framer-motion', () => {
  const MockMotionDiv = ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
    const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
    return <div {...rest}>{children}</div>
  }

  return {
    motion: {
      div: MockMotionDiv,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})
