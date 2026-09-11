export type PreviewComponent = { hexColor: string; sizeMm: number };

const VIEW_WIDTH = 520;
const VIEW_HEIGHT = 150;

const DEFAULT_COLOR = '#F0369B';

function safeColor(value: string) {
	return /^#[0-9A-Fa-f]{6}$/.test(value.trim()) ? value.trim() : DEFAULT_COLOR;
}

export function renderDesignPreview(components: PreviewComponent[], claspColor: string | null) {
	if (components.length === 0) {
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}"></svg>`;
	}

	const padding = 40;
	const usable = VIEW_WIDTH - padding * 2;
	const step = usable / Math.max(components.length - 1, 1);

	const beads = components
		.map((component, index) => {
			const x = padding + index * step;
			const progress = components.length === 1 ? 0.5 : index / (components.length - 1);
			const y = 60 + Math.sin(progress * Math.PI) * 34;
			const radius = Math.max(5, Math.min(16, component.sizeMm));

			return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}" fill="${safeColor(component.hexColor)}" stroke="#2e1b33" stroke-width="2" />`;
		})
		.join('');

	const cordPoints = components
		.map((_, index) => {
			const x = padding + index * step;
			const progress = components.length === 1 ? 0.5 : index / (components.length - 1);
			const y = 60 + Math.sin(progress * Math.PI) * 34;

			return `${x.toFixed(1)},${y.toFixed(1)}`;
		})
		.join(' ');

	const clasp = claspColor
		? `<circle cx="${padding - 18}" cy="60" r="8" fill="${safeColor(claspColor)}" stroke="#2e1b33" stroke-width="2" />` +
			`<circle cx="${VIEW_WIDTH - padding + 18}" cy="60" r="8" fill="${safeColor(claspColor)}" stroke="#2e1b33" stroke-width="2" />`
		: '';

	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}" role="img" aria-label="Aperçu de la création">`,
		`<polyline points="${cordPoints}" fill="none" stroke="#2e1b33" stroke-width="2" stroke-linecap="round" />`,
		clasp,
		beads,
		'</svg>'
	].join('');
}
