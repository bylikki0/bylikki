import { untrack } from 'svelte';
import { browser } from '$app/environment';
import { MAX_BEADS } from '$lib/client/validation/atelier';

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

export type StrandItem = { id: string; key: string };

type StrandComponent = { key: string; kind: string; stock: number };

const STRAND_KEY = 'bylikki:strand:v1';
const STARTER_BEADS = 3;

function readStoredStrand(): string[] | null {
	if (!browser) {
		return null;
	}

	try {
		const raw = window.localStorage.getItem(STRAND_KEY);

		if (raw === null) {
			return null;
		}

		const parsed: unknown = JSON.parse(raw);

		return Array.isArray(parsed)
			? parsed.filter((key): key is string => typeof key === 'string')
			: null;
	} catch {
		return null;
	}
}

class StrandStore {
	#nextId = 0;
	#hydrated = false;
	items = $state<StrandItem[]>([]);
	keys = $state<string[]>([]);
	full = $derived(this.keys.length >= MAX_BEADS);

	#item(key: string): StrandItem {
		return { id: `fil-${this.#nextId++}`, key };
	}

	#settle(items: StrandItem[]) {
		this.items = items;
		this.keys = items.map((item) => item.key);

		if (!browser) {
			return;
		}

		try {
			window.localStorage.setItem(STRAND_KEY, JSON.stringify(this.keys));
		} catch {
			return;
		}
	}

	hydrate(components: StrandComponent[]) {
		untrack(() => this.#hydrateNow(components));
	}

	#hydrateNow(components: StrandComponent[]) {
		const usable = components
			.filter((component) => component.stock > 0)
			.map((component) => component.key);
		const source = this.#hydrated
			? this.keys
			: (readStoredStrand() ??
				components
					.filter((component) => component.kind === 'BEAD' && component.stock > 0)
					.slice(0, STARTER_BEADS)
					.map((component) => component.key));

		this.#hydrated = true;

		const kept = source.filter((key) => usable.includes(key)).slice(0, MAX_BEADS);

		if (kept.join('|') === this.keys.join('|') && this.items.length === kept.length) {
			return;
		}

		this.#settle(kept.map((key) => this.#item(key)));
	}

	add(key: string) {
		if (!this.full) {
			this.#settle([...this.items, this.#item(key)]);
		}
	}

	preview(items: StrandItem[]) {
		this.items = items;
	}

	commit(items: StrandItem[]) {
		this.#settle(
			items
				.slice(0, MAX_BEADS)
				.map((item) =>
					item.id.startsWith('fil-') ? { id: item.id, key: item.key } : this.#item(item.key)
				)
		);
	}

	removeAt(index: number) {
		this.#settle(this.items.filter((_, position) => position !== index));
	}

	remove(id: string) {
		this.#settle(this.items.filter((item) => item.id !== id));
	}

	move(index: number, direction: -1 | 1) {
		const target = index + direction;

		if (target < 0 || target >= this.items.length) {
			return false;
		}

		const next = [...this.items];
		[next[index], next[target]] = [next[target], next[index]];
		this.#settle(next);

		return true;
	}

	reset() {
		this.#settle([]);
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
