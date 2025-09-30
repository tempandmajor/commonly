/**
 * @file Test setup for User Service tests
 */
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock the console.error to avoid cluttering test output
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
    args[0]?.includes?.('Warning: useLayoutEffect does nothing on the server')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock for local storage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: key => store[key],
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: key => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock for IntersectionObserver
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
    this.elements = new Set();
  }

  observe(element) {
    this.elements.add(element);
  }

  unobserve(element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }

  // Methods to trigger intersection events in tests
  triggerIntersection(entries) {
    this.callback(entries, this);
  }
}

window.IntersectionObserver = IntersectionObserverMock;

// Mock fetch
global.fetch = vi.fn();

// Clean up all mocks after each test
afterEach(() => {
  vi.resetAllMocks();
});
