import '@testing-library/jest-dom';

// Mock window.matchMedia for responsive styling & component testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver for charts and responsive layout containers
window.ResizeObserver = class ResizeObserver {
  observe() { /* Do nothing for testing purposes */ }
  unobserve() { /* Do nothing for testing purposes */ }
  disconnect() { /* Do nothing for testing purposes */ }
};

// Mock IntersectionObserver for infinite scrolling and lazy loading component tests
window.IntersectionObserver = class IntersectionObserver {
  observe() { /* Do nothing for testing purposes */ }
  unobserve() { /* Do nothing for testing purposes */ }
  disconnect() { /* Do nothing for testing purposes */ }
};

// Mock HTMLCanvasElement for Excalidraw / Virtual Classroom component tests
if (typeof window !== 'undefined' && HTMLCanvasElement) {
  HTMLCanvasElement.prototype.getContext = () => ({
    fillRect: () => { /* Do nothing for testing purposes */ },
    clearRect: () => { /* Do nothing for testing purposes */ },
    getImageData: (x, y, w, h) => ({
      data: new Array(w * h * 4),
    }),
    putImageData: () => { /* Do nothing for testing purposes */ },
    createImageData: () => [],
    setTransform: () => { /* Do nothing for testing purposes */ },
    drawImage: () => { /* Do nothing for testing purposes */ },
    save: () => { /* Do nothing for testing purposes */ },
    fillText: () => { /* Do nothing for testing purposes */ },
    restore: () => { /* Do nothing for testing purposes */ },
    beginPath: () => { /* Do nothing for testing purposes */ },
    moveTo: () => { /* Do nothing for testing purposes */ },
    lineTo: () => { /* Do nothing for testing purposes */ },
    closePath: () => { /* Do nothing for testing purposes */ },
    stroke: () => { /* Do nothing for testing purposes */ },
    translate: () => { /* Do nothing for testing purposes */ },
    scale: () => { /* Do nothing for testing purposes */ },
    rotate: () => { /* Do nothing for testing purposes */ },
    arc: () => { /* Do nothing for testing purposes */ },
    fill: () => { /* Do nothing for testing purposes */ },
    measureText: () => ({ width: 0 }),
    transform: () => { /* Do nothing for testing purposes */ },
    rect: () => { /* Do nothing for testing purposes */ },
    clip: () => { /* Do nothing for testing purposes */ },
  });
}
