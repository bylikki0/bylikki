export type Slide = {
	kicker: string;
	title: string;
	desc: string;
	cta: string;
};

export type Product = {
	slug: string;
	tag: string;
	name: string;
	note: string;
	price: string;
	photo: string;
};

export type Review = {
	text: string;
	name: string;
	date: string;
	item: string;
};

export const slides: Slide[] = [
	{
		kicker: 'Découvrir la boutique',
		title: 'Les dernières créations',
		desc: 'Bijoux et pièces cousues, en petites séries. Ce qui part ne revient pas toujours.',
		cta: 'Visiter la boutique →'
	},
	{
		kicker: 'Personnalisation',
		title: 'Personnalise ton bijou',
		desc: 'Choisis tes perles, assemble-les, et repars avec une pièce que personne d’autre n’a.',
		cta: 'Créer mon bijou →'
	},
	{
		kicker: 'À la une',
		title: 'La collection Étoiles',
		desc: 'Six pièces autour d’un même motif : la petite étoile cousue ou enfilée à la main.',
		cta: 'Découvrir →'
	},
	{
		kicker: 'Upcycling',
		title: 'Upcycling du moment',
		desc: 'Un sac né d’un jean chiné et de trois chutes de tissu. Un seul exemplaire.',
		cta: 'Découvrir la pièce →'
	}
];

export const products: Product[] = [
	{
		slug: 'collier-etoile-filante',
		tag: 'Nouveau',
		name: 'Collier « Étoile Filante »',
		note: 'perles de verre chinées',
		price: '26,00 €',
		photo: 'PHOTO PRODUIT — collier\nsur fond clair'
	},
	{
		slug: 'bijou-sur-mesure',
		tag: 'Personnalisable',
		name: 'Ton bijou sur mesure',
		note: 'tes perles, ton fermoir',
		price: 'dès 22,00 €',
		photo: 'PHOTO — perles à choisir'
	},
	{
		slug: 'collection-etoiles',
		tag: 'À la une',
		name: 'Collection Étoiles',
		note: '6 pièces autour du même motif',
		price: 'dès 18,00 €',
		photo: 'PHOTO — collection Étoiles'
	},
	{
		slug: 'sac-patchwork-4',
		tag: 'Pièce unique',
		name: 'Sac Patchwork n°4',
		note: 'jean chiné + chutes de tissu',
		price: '48,00 €',
		photo: 'PHOTO — sac upcyclé'
	}
];

export const reviewCardBg = ['#FFF4C2', '#D8F0FB', '#FFE9F2', '#DDF4E2', '#E9DFFF'];
export const reviewCardRadius = [
	'30px 70px 26px 60px',
	'70px 26px 60px 30px',
	'26px 60px 30px 70px',
	'60px 30px 70px 26px'
];

export const reviews: Review[] = [
	{
		text: 'J’adore tellement mon collier, il est encore plus beau en vrai !',
		name: 'Emma',
		date: '12.08.2026',
		item: 'Collier Étoile Filante'
	},
	{
		text: 'Le paquet était trop mignon, j’ai gardé l’emballage.',
		name: 'Lina',
		date: '04.08.2026',
		item: 'Boucles Perles Fraise'
	},
	{
		text: 'J’ai composé mes perles moi-même, résultat parfait.',
		name: 'Chloé',
		date: '29.07.2026',
		item: 'Collier personnalisé'
	},
	{
		text: 'Ma trousse a survécu à un an de fac, rien n’a bougé.',
		name: 'Jeanne',
		date: '21.07.2026',
		item: 'Trousse Denim'
	},
	{
		text: 'Reçu en 3 jours avec un petit mot écrit à la main ♡',
		name: 'Manon',
		date: '15.07.2026',
		item: 'Bijou de téléphone'
	},
	{
		text: 'Le sac patchwork attire tous les compliments.',
		name: 'Sarah',
		date: '02.07.2026',
		item: 'Sac Patchwork n°4'
	},
	{
		text: 'Deuxième commande, et toujours aussi contente.',
		name: 'Inès',
		date: '24.06.2026',
		item: 'Boucles Marguerite'
	},
	{
		text: 'Les couleurs sont exactement comme sur les photos.',
		name: 'Léa',
		date: '18.06.2026',
		item: 'Collier Perles Ciel'
	},
	{
		text: 'Offert à ma sœur, elle ne le quitte plus.',
		name: 'Camille',
		date: '09.06.2026',
		item: 'Bracelet Bonbon'
	},
	{
		text: 'Ultra léger à porter, on l’oublie complètement.',
		name: 'Zoé',
		date: '30.05.2026',
		item: 'Boucles Étoile'
	},
	{
		text: 'La pochette upcyclée est unique, j’adore ce concept.',
		name: 'Alice',
		date: '22.05.2026',
		item: 'Pochette Rubans'
	},
	{
		text: 'Réponse en 10 minutes sur Insta pour une taille. Top.',
		name: 'Nour',
		date: '11.05.2026',
		item: 'Collier personnalisé'
	}
];

export const beadPalette = [
	'#F0369B',
	'#FFDE59',
	'#A98BF5',
	'#6EC6EE',
	'#7ED598',
	'#FFD6E6',
	'#FF6F3C',
	'#FFFCF7'
];

export const shopLinks = [
	'Nouveautés',
	'Bijoux',
	'Couture',
	'Upcycling',
	'Personnalisation',
	'Tous les produits'
];

export const infoLinks: { label: string; href: string }[] = [
	{ label: 'Avis', href: '/#avis' },
	{ label: 'À propos', href: '/#a-propos' },
	{ label: 'CGU', href: '/legal?doc=cgu' },
	{ label: 'CGV', href: '/legal?doc=cgv' },
	{ label: 'Politique de confidentialité', href: '/legal?doc=rgpd' },
	{ label: 'Cookies', href: '/legal?doc=cookies' }
];

export const socialLinks = ['Instagram', 'TikTok', 'Pinterest'];
