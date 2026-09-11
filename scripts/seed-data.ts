export const CATEGORIES = [
	{
		slug: 'bijoux',
		name: 'Bijoux',
		description: 'Colliers, bracelets et boucles, faits main.',
		position: 0,
		parent: null
	},
	{
		slug: 'bracelets',
		name: 'Bracelets',
		description: 'Perles enfilees une a une.',
		position: 1,
		parent: 'bijoux'
	},
	{
		slug: 'colliers',
		name: 'Colliers',
		description: 'Ras-de-cou et sautoirs.',
		position: 2,
		parent: 'bijoux'
	},
	{
		slug: 'couture',
		name: 'Couture',
		description: 'Pieces cousues en petites series.',
		position: 3,
		parent: null
	},
	{
		slug: 'upcycling',
		name: 'Upcycling',
		description: 'Une seconde vie, un seul exemplaire.',
		position: 4,
		parent: null
	}
] as const;

export const ATTRIBUTES = [
	{
		key: 'couleur',
		label: 'Couleur',
		kind: 'COLOR' as const,
		variantAxis: true,
		position: 0,
		values: [
			{ value: 'rose', label: 'Rose', hexColor: '#f0369b' },
			{ value: 'jaune', label: 'Jaune', hexColor: '#ffde59' },
			{ value: 'bleu', label: 'Bleu', hexColor: '#6ec6ee' },
			{ value: 'vert', label: 'Vert', hexColor: '#7ed598' },
			{ value: 'violet', label: 'Violet', hexColor: '#a98bf5' }
		]
	},
	{
		key: 'taille',
		label: 'Taille',
		kind: 'SELECT' as const,
		variantAxis: true,
		position: 1,
		values: [
			{ value: 's', label: 'S', hexColor: null },
			{ value: 'm', label: 'M', hexColor: null },
			{ value: 'l', label: 'L', hexColor: null }
		]
	},
	{
		key: 'matiere',
		label: 'Matiere',
		kind: 'SELECT' as const,
		variantAxis: false,
		position: 2,
		values: [
			{ value: 'verre', label: 'Verre', hexColor: null },
			{ value: 'laiton', label: 'Laiton', hexColor: null },
			{ value: 'coton', label: 'Coton', hexColor: null }
		]
	}
] as const;

export type DemoProduct = {
	slug: string;
	name: string;
	summary: string;
	description: string;
	story?: string;
	badge?: string;
	basePriceCents: number;
	featured: boolean;
	categories: string[];
	colors: string[];
	matiere: string;
	firstStock: number;
};

export const PRODUCTS: DemoProduct[] = [
	{
		slug: 'demo-bracelet-etoile',
		name: 'Bracelet Etoile',
		summary: 'Perles de verre et une petite etoile en laiton.',
		description:
			"Un bracelet monte a la main, perle par perle, autour d'une etoile en laiton. Le fil est double et noue, pour qu'il tienne les jours ou on l'oublie.",
		story: 'Ne un dimanche de pluie, en vidant un bocal de perles chinees.',
		badge: 'Coup de coeur',
		basePriceCents: 2400,
		featured: true,
		categories: ['bijoux', 'bracelets'],
		colors: ['rose', 'jaune', 'bleu'],
		matiere: 'verre',
		firstStock: 8
	},
	{
		slug: 'demo-collier-perles',
		name: 'Collier Perles',
		summary: 'Un ras-de-cou court, en perles de verre.',
		description:
			'Trente-deux perles de verre, montees serrees sur un fil souple. Le fermoir est en laiton dore, choisi pour ne pas verdir.',
		basePriceCents: 3200,
		featured: true,
		categories: ['bijoux', 'colliers'],
		colors: ['rose', 'violet'],
		matiere: 'verre',
		firstStock: 0
	},
	{
		slug: 'demo-sac-upcycle',
		name: 'Sac Upcycle',
		summary: 'Un jean chine, trois chutes de tissu.',
		description:
			"Une piece unique, cousue dans un jean de seconde main et doublee de chutes de coton. Les coutures sont apparentes, c'est voulu.",
		story: "Le jean vient d'une friperie nantaise. Il n'y en aura pas d'autre comme lui.",
		badge: 'Piece unique',
		basePriceCents: 5800,
		featured: true,
		categories: ['couture', 'upcycling'],
		colors: ['bleu'],
		matiere: 'coton',
		firstStock: 1
	},
	{
		slug: 'demo-boucles-goutte',
		name: 'Boucles Goutte',
		summary: 'Deux gouttes de verre, montees sur laiton.',
		description:
			'Des boucles legeres, qui bougent avec la tete. Les crochets sont en laiton, sans nickel.',
		basePriceCents: 1900,
		featured: true,
		categories: ['bijoux'],
		colors: ['jaune', 'vert'],
		matiere: 'laiton',
		firstStock: 12
	},
	{
		slug: 'demo-trousse-fleurs',
		name: 'Trousse Fleurs',
		summary: 'Coton imprime, doublee, fermeture eclair.',
		description:
			'Une trousse assez large pour tenir ouverte toute seule. Doublure en coton uni, fermeture eclair cousue a la machine.',
		basePriceCents: 2600,
		featured: false,
		categories: ['couture'],
		colors: ['rose', 'vert'],
		matiere: 'coton',
		firstStock: 5
	},
	{
		slug: 'demo-bracelet-jonc',
		name: 'Bracelet Jonc',
		summary: 'Un jonc de laiton martele a la main.',
		description:
			"Le laiton est martele au marteau a panne ronde : chaque jonc porte des marques differentes. Il s'ouvre juste assez pour passer le poignet.",
		basePriceCents: 2900,
		featured: false,
		categories: ['bijoux', 'bracelets'],
		colors: ['jaune'],
		matiere: 'laiton',
		firstStock: 4
	},
	{
		slug: 'demo-pochette-jean',
		name: 'Pochette Jean',
		summary: 'Une poche arriere devenue pochette.',
		description:
			"Decoupee dans la poche arriere d'un jean, doublee et bordee d'un biais fait maison. Se glisse dans un sac plus grand.",
		basePriceCents: 2200,
		featured: false,
		categories: ['upcycling', 'couture'],
		colors: ['bleu', 'rose'],
		matiere: 'coton',
		firstStock: 3
	},
	{
		slug: 'demo-sautoir-lune',
		name: 'Sautoir Lune',
		summary: 'Un sautoir long, une lune en laiton.',
		description:
			"Assez long pour se porter double. La lune est decoupee et limee a la main, ce qui explique qu'aucune ne soit tout a fait ronde.",
		badge: 'Nouveau',
		basePriceCents: 3600,
		featured: false,
		categories: ['bijoux', 'colliers'],
		colors: ['violet', 'bleu'],
		matiere: 'laiton',
		firstStock: 6
	}
];

export const COMPONENTS = [
	{
		key: 'demo-perle-rose',
		label: 'Perle rose',
		kind: 'BEAD' as const,
		hexColor: '#f0369b',
		sizeMm: 8,
		priceCents: 120,
		stock: 200
	},
	{
		key: 'demo-perle-jaune',
		label: 'Perle jaune',
		kind: 'BEAD' as const,
		hexColor: '#ffde59',
		sizeMm: 8,
		priceCents: 120,
		stock: 180
	},
	{
		key: 'demo-perle-bleue',
		label: 'Perle bleue',
		kind: 'BEAD' as const,
		hexColor: '#6ec6ee',
		sizeMm: 8,
		priceCents: 120,
		stock: 160
	},
	{
		key: 'demo-perle-verte',
		label: 'Perle verte',
		kind: 'BEAD' as const,
		hexColor: '#7ed598',
		sizeMm: 8,
		priceCents: 120,
		stock: 150
	},
	{
		key: 'demo-perle-violette',
		label: 'Perle violette',
		kind: 'BEAD' as const,
		hexColor: '#a98bf5',
		sizeMm: 8,
		priceCents: 130,
		stock: 140
	},
	{
		key: 'demo-perle-creme',
		label: 'Perle creme',
		kind: 'BEAD' as const,
		hexColor: '#fff9f2',
		sizeMm: 6,
		priceCents: 100,
		stock: 220
	},
	{
		key: 'demo-perle-encre',
		label: 'Perle encre',
		kind: 'BEAD' as const,
		hexColor: '#2e1b33',
		sizeMm: 6,
		priceCents: 100,
		stock: 210
	},
	{
		key: 'demo-perle-rose-pale',
		label: 'Perle rose pale',
		kind: 'BEAD' as const,
		hexColor: '#ffd6e6',
		sizeMm: 10,
		priceCents: 150,
		stock: 90
	},
	{
		key: 'demo-perle-jaune-doux',
		label: 'Perle jaune doux',
		kind: 'BEAD' as const,
		hexColor: '#fff4c2',
		sizeMm: 10,
		priceCents: 150,
		stock: 85
	},
	{
		key: 'demo-perle-bleu-doux',
		label: 'Perle bleu doux',
		kind: 'BEAD' as const,
		hexColor: '#d8f0fb',
		sizeMm: 10,
		priceCents: 150,
		stock: 80
	},
	{
		key: 'demo-fermoir-dore',
		label: 'Fermoir dore',
		kind: 'CLASP' as const,
		hexColor: '#ffde59',
		sizeMm: 6,
		priceCents: 320,
		stock: 60
	},
	{
		key: 'demo-fermoir-argente',
		label: 'Fermoir argente',
		kind: 'CLASP' as const,
		hexColor: '#d8f0fb',
		sizeMm: 6,
		priceCents: 320,
		stock: 55
	},
	{
		key: 'demo-breloque-etoile',
		label: 'Breloque etoile',
		kind: 'CHARM' as const,
		hexColor: '#ffde59',
		sizeMm: 12,
		priceCents: 260,
		stock: 40
	},
	{
		key: 'demo-breloque-lune',
		label: 'Breloque lune',
		kind: 'CHARM' as const,
		hexColor: '#a98bf5',
		sizeMm: 12,
		priceCents: 260,
		stock: 38
	},
	{
		key: 'demo-breloque-coeur',
		label: 'Breloque coeur',
		kind: 'CHARM' as const,
		hexColor: '#f0369b',
		sizeMm: 12,
		priceCents: 260,
		stock: 42
	},
	{
		key: 'demo-cordon-coton',
		label: 'Cordon coton',
		kind: 'CORD' as const,
		hexColor: '#fff9f2',
		sizeMm: 4,
		priceCents: 180,
		stock: 100
	}
];

export const REVIEW_AUTHORS = [
	{ key: 'camille', displayName: 'Camille' },
	{ key: 'lea', displayName: 'Lea' },
	{ key: 'manon', displayName: 'Manon' },
	{ key: 'sarah', displayName: 'Sarah' },
	{ key: 'ines', displayName: 'Ines' }
];

export const REVIEWS = [
	{
		author: 'camille',
		productSlug: 'demo-bracelet-etoile',
		rating: 5,
		title: 'Porte tous les jours',
		body: "Recu en trois jours, emballe dans du papier de soie. Je ne l'enleve plus, meme sous la douche, et il n'a pas bouge.",
		status: 'PUBLISHED' as const,
		reply: 'Merci Camille ! Le fil est double justement pour ca.'
	},
	{
		author: 'lea',
		productSlug: 'demo-bracelet-etoile',
		rating: 5,
		title: 'Le jaune est parfait',
		body: "La couleur est exactement celle de la photo, ce qui est rare. L'etoile est plus fine que je ne pensais, en mieux.",
		status: 'PUBLISHED' as const
	},
	{
		author: 'manon',
		productSlug: 'demo-collier-perles',
		rating: 4,
		title: 'Tres joli, un peu court',
		body: "Le collier est magnifique et le fermoir tient bien. Je l'aurais aime deux centimetres plus long, mais c'est un gout personnel.",
		status: 'PUBLISHED' as const
	},
	{
		author: 'sarah',
		productSlug: 'demo-collier-perles',
		rating: 5,
		title: 'Cadeau parfait',
		body: "Offert a ma soeur pour son anniversaire, elle ne l'a pas quitte de la soiree. L'emballage fait vraiment cadeau.",
		status: 'PUBLISHED' as const,
		reply: 'Un grand merci, et bon anniversaire a ta soeur !'
	},
	{
		author: 'camille',
		productSlug: 'demo-sac-upcycle',
		rating: 5,
		title: 'Une piece qui dure',
		body: "On voit tout de suite que c'est cousu main. Le jean est epais, les coutures apparentes donnent du caractere. Il tient un ordinateur portable.",
		status: 'PUBLISHED' as const
	},
	{
		author: 'lea',
		productSlug: 'demo-sac-upcycle',
		rating: 4,
		title: 'Solide et original',
		body: 'Beau travail de recuperation. La doublure est bien faite. Une poche interieure en plus serait le detail qui manque.',
		status: 'PUBLISHED' as const
	},
	{
		author: 'manon',
		productSlug: 'demo-boucles-goutte',
		rating: 5,
		title: 'Legeres, on les oublie',
		body: "Je ne supporte pas grand-chose aux oreilles, celles-ci ne me font rien du tout. Le laiton ne m'a pas irritee.",
		status: 'PUBLISHED' as const
	},
	{
		author: 'sarah',
		productSlug: 'demo-boucles-goutte',
		rating: 5,
		title: 'Vues partout depuis',
		body: "Trois personnes m'ont demande d'ou elles venaient la premiere semaine. Le vert attrape la lumiere.",
		status: 'PUBLISHED' as const
	},
	{
		author: 'ines',
		productSlug: 'demo-trousse-fleurs',
		rating: 4,
		title: 'Bien pensee',
		body: 'Elle tient ouverte toute seule, ce qui change tout pour retrouver ses affaires. Le tissu est doux.',
		status: 'PUBLISHED' as const
	},
	{
		author: 'ines',
		productSlug: 'demo-sautoir-lune',
		rating: 5,
		title: 'Se porte double',
		body: "Assez long pour faire deux tours, et la lune est irreguliere comme annonce. C'est ce qui fait son charme.",
		status: 'PUBLISHED' as const
	},
	{
		author: 'ines',
		productSlug: 'demo-bracelet-jonc',
		rating: 3,
		title: 'Un peu large pour moi',
		body: 'Le martelage est superbe mais le jonc glisse sur mon poignet. Il faudrait une taille en dessous.',
		status: 'PENDING' as const
	},
	{
		author: 'sarah',
		productSlug: 'demo-pochette-jean',
		rating: 2,
		title: 'Couture a reprendre',
		body: "Le biais s'est defait au bout de deux semaines sur un angle. Le reste est impeccable, mais je le signale.",
		status: 'REJECTED' as const
	}
];

export const DISCOUNTS = [
	{
		code: 'DEMO10',
		label: 'Dix pour cent de bienvenue',
		kind: 'PERCENTAGE' as const,
		value: 10,
		active: true,
		minSubtotalCents: 2000,
		expiresAt: null as Date | null
	},
	{
		code: 'DEMOPORT',
		label: 'Frais de port offerts (expire)',
		kind: 'FREE_SHIPPING' as const,
		value: 0,
		active: true,
		minSubtotalCents: 0,
		expiresAt: new Date('2026-01-01T00:00:00.000Z') as Date | null
	}
];
