import { browser } from '$app/environment';

export type CartCustomization = { key: string; label: string; value: string };

export type CartLine = {
	variantId: string;
	productSlug: string;
	productName: string;
	variantLabel: string;
	unitPriceCents: number;
	quantity: number;
	customization: CartCustomization[];
	imageUrl: string | null;
};

const STORAGE_KEY = 'bylikki:cart:v1';
const MAX_QUANTITY = 9;

function lineKey(line: Pick<CartLine, 'variantId' | 'customization'>) {
	const options = [...line.customization]
		.sort((left, right) => left.key.localeCompare(right.key))
		.map((entry) => `${entry.key}=${entry.value}`)
		.join('|');

	return `${line.variantId}::${options}`;
}

function readStoredLines(): CartLine[] {
	if (!browser) {
		return [];
	}

	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		const parsed: unknown = raw ? JSON.parse(raw) : [];

		return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
	} catch {
		return [];
	}
}

class CartStore {
	lines = $state<CartLine[]>(readStoredLines());

	count = $derived(this.lines.reduce((total, line) => total + line.quantity, 0));
	subtotalCents = $derived(
		this.lines.reduce((total, line) => total + line.unitPriceCents * line.quantity, 0)
	);

	keyOf(line: CartLine) {
		return lineKey(line);
	}

	private persist() {
		if (!browser) {
			return;
		}

		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.lines));
		} catch {
			return;
		}
	}

	add(line: CartLine) {
		const key = lineKey(line);
		const existing = this.lines.find((candidate) => lineKey(candidate) === key);

		if (existing) {
			existing.quantity = Math.min(existing.quantity + line.quantity, MAX_QUANTITY);
		} else {
			this.lines.push({ ...line, quantity: Math.min(line.quantity, MAX_QUANTITY) });
		}

		this.persist();
	}

	setQuantity(key: string, quantity: number) {
		const index = this.lines.findIndex((line) => lineKey(line) === key);

		if (index === -1) {
			return;
		}

		if (quantity <= 0) {
			this.lines.splice(index, 1);
		} else {
			this.lines[index].quantity = Math.min(quantity, MAX_QUANTITY);
		}

		this.persist();
	}

	remove(key: string) {
		this.lines = this.lines.filter((line) => lineKey(line) !== key);
		this.persist();
	}

	clear() {
		this.lines = [];
		this.persist();
	}

	toPayload() {
		return this.lines.map((line) => ({
			variantId: line.variantId,
			quantity: line.quantity,
			customization: line.customization.map((entry) => ({ key: entry.key, value: entry.value }))
		}));
	}
}

class UiStore {
	menuOpen = $state(false);
	cartOpen = $state(false);
	searchOpen = $state(false);

	toggleMenu() {
		this.menuOpen = !this.menuOpen;
		if (this.menuOpen) {
			this.cartOpen = false;
			this.searchOpen = false;
		}
	}

	openCart() {
		this.cartOpen = true;
		this.menuOpen = false;
		this.searchOpen = false;
	}

	toggleCart() {
		this.cartOpen = !this.cartOpen;
		if (this.cartOpen) {
			this.menuOpen = false;
			this.searchOpen = false;
		}
	}

	toggleSearch() {
		this.searchOpen = !this.searchOpen;
		if (this.searchOpen) {
			this.menuOpen = false;
			this.cartOpen = false;
		}
	}

	closeAll() {
		this.menuOpen = false;
		this.cartOpen = false;
		this.searchOpen = false;
	}
}

export type StrandBead = { id: string; color: string };

export const MAX_STRAND_BEADS = 16;

class StrandStore {
	#nextId = 0;
	beads = $state<StrandBead[]>([]);

	constructor() {
		for (const color of ['#F0369B', '#FFDE59', '#6EC6EE']) {
			this.add(color);
		}
	}

	add(color: string) {
		if (this.beads.length < MAX_STRAND_BEADS) {
			this.beads.push({ id: `perle-${this.#nextId++}`, color });
		}
	}

	set(items: StrandBead[]) {
		this.beads = items;
	}

	remove(id: string) {
		this.beads = this.beads.filter((candidate) => candidate.id !== id);
	}

	reset() {
		this.beads = [];
	}
}

const WISHLIST_KEY = 'bylikki:wishlist:v1';

function readStoredWishlist(): string[] {
	if (!browser) {
		return [];
	}

	try {
		const raw = window.localStorage.getItem(WISHLIST_KEY);

		return raw ? (JSON.parse(raw) as string[]) : [];
	} catch {
		return [];
	}
}

class WishlistStore {
	ids = $state<string[]>(readStoredWishlist());

	count = $derived(this.ids.length);

	has(productId: string) {
		return this.ids.includes(productId);
	}

	private persist() {
		if (!browser) {
			return;
		}

		try {
			window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(this.ids));
		} catch {
			return;
		}
	}

	toggleLocal(productId: string) {
		this.ids = this.has(productId)
			? this.ids.filter((id) => id !== productId)
			: [...this.ids, productId];

		this.persist();
	}

	adopt(ids: string[]) {
		this.ids = [...ids];
		this.persist();
	}

	pending() {
		return readStoredWishlist();
	}
}

export const cart = new CartStore();
export const ui = new UiStore();
export const strand = new StrandStore();
export const wishlist = new WishlistStore();
