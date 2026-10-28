import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
import React from 'react'

// Mock framer-motion globally for all tests to avoid animation delays
vi.mock('framer-motion', () => {
  const createMockComponent = (tagName: string) => {
    // Animation props are dropped; everything else reaches the real DOM node.
    const MOTION_ONLY = ['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap']
    return ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
      const rest = Object.fromEntries(
        Object.entries(props).filter(([name]) => !MOTION_ONLY.includes(name))
      )
      return React.createElement(tagName, rest, children)
    }
  }

  return {
    motion: {
      div: createMockComponent('div'),
      button: createMockComponent('button'),
      span: createMockComponent('span'),
      p: createMockComponent('p'),
      h1: createMockComponent('h1'),
      h2: createMockComponent('h2'),
      h3: createMockComponent('h3'),
      ul: createMockComponent('ul'),
      li: createMockComponent('li'),
      a: createMockComponent('a'),
      input: createMockComponent('input'),
      form: createMockComponent('form'),
      img: createMockComponent('img'),
      svg: createMockComponent('svg'),
      path: createMockComponent('path'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})
