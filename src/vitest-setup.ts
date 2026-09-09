import '@testing-library/jest-dom/vitest';

if (typeof globalThis.ResizeObserver === 'undefined') {
	globalThis.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}

if (typeof Element.prototype.getAnimations !== 'function') {
	Element.prototype.getAnimations = function getAnimations() {
		return [];
	};
}
