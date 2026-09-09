type CartLine = { name: string; variant: string; qty: number; unit: number };

const euro = (n: number) => n.toFixed(2).replace('.', ',') + ' €';

/** Panier fictif partagé par la topbar, le tiroir et la page produit. */
class CartStore {
	lines = $state<CartLine[]>([
		{ name: 'Collier « Étoile Filante »', variant: '42 cm · perles roses', qty: 1, unit: 26 },
		{ name: 'Boucles « Perles Fraise »', variant: 'argenté', qty: 1, unit: 18 }
	]);

	count = $derived(this.lines.reduce((n, l) => n + l.qty, 0));
	subtotal = $derived(euro(this.lines.reduce((n, l) => n + l.unit * l.qty, 0)));

	lineTotal(line: CartLine) {
		return euro(line.unit * line.qty);
	}

	inc(i: number) {
		this.lines[i].qty += 1;
	}

	dec(i: number) {
		if (this.lines[i].qty <= 1) this.lines.splice(i, 1);
		else this.lines[i].qty -= 1;
	}

	add(line: CartLine) {
		const found = this.lines.find((l) => l.name === line.name && l.variant === line.variant);
		if (found) found.qty += line.qty;
		else this.lines.push(line);
	}
}

/** Ouverture des tiroirs menu / panier. */
class UiStore {
	menuOpen = $state(false);
	cartOpen = $state(false);
	scrollFuse = $state(0);

	toggleMenu() {
		this.menuOpen = !this.menuOpen;
		if (this.menuOpen) this.cartOpen = false;
	}

	toggleCart() {
		this.cartOpen = !this.cartOpen;
		if (this.cartOpen) this.menuOpen = false;
	}

	closeAll() {
		this.menuOpen = false;
		this.cartOpen = false;
	}
}

/** Atelier perles : composition du collier. */
class StrandStore {
	beads = $state<string[]>(['#F0369B', '#FFDE59', '#6EC6EE']);

	add(color: string) {
		if (this.beads.length < 12) this.beads.push(color);
	}

	remove(i: number) {
		this.beads.splice(i, 1);
	}

	reset() {
		this.beads = [];
	}
}

export const cart = new CartStore();
export const ui = new UiStore();
export const strand = new StrandStore();
export { euro };
