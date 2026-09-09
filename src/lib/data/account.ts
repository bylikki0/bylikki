export type OrderState = 'cours' | 'recu' | 'retour' | 'rembourse';

export type Order = {
	ref: string;
	date: string;
	title: string;
	detail: string;
	total: string;
	state: OrderState;
	status: string;
	next: string;
	action: string;
	action2: string;
	photo: string;
};

export const statusBg: Record<OrderState, string> = {
	cours: '#FFF4C2',
	recu: '#DDF4E2',
	retour: '#E9DFFF',
	rembourse: '#FFE9F2'
};

export const orderFilters: { id: 'toutes' | OrderState; label: string }[] = [
	{ id: 'toutes', label: 'Toutes' },
	{ id: 'cours', label: 'En cours' },
	{ id: 'recu', label: 'Reçues' },
	{ id: 'retour', label: 'Retours' },
	{ id: 'rembourse', label: 'Remboursées' }
];

export const orders: Order[] = [
	{
		ref: '#BY-2041',
		date: '02.09.2026',
		title: 'Collier « Étoile Filante »',
		detail: '42 cm · perles roses · 1 article',
		total: '26,00 €',
		state: 'cours',
		status: 'En préparation',
		next: 'Expédition prévue le 05.09 — cousu cette semaine.',
		action: 'Voir la commande',
		action2: 'Annuler la commande',
		photo: 'PHOTO — collier'
	},
	{
		ref: '#BY-2036',
		date: '27.08.2026',
		title: 'Sac Patchwork n°4',
		detail: 'jean chiné + chutes de tissu · pièce unique',
		total: '48,00 €',
		state: 'cours',
		status: 'Expédiée',
		next: 'Colissimo 6A 1234 5678 9 — livraison estimée le 09.09.',
		action: 'Suivre le colis',
		action2: 'Contacter le SAV',
		photo: 'PHOTO — sac upcyclé'
	},
	{
		ref: '#BY-1988',
		date: '11.08.2026',
		title: 'Boucles « Perles Fraise »',
		detail: 'argenté · 1 article',
		total: '18,00 €',
		state: 'recu',
		status: 'Reçue',
		next: 'Livrée le 14.08. Retour possible jusqu’au 28.08.',
		action: 'Racheter',
		action2: 'Laisser un avis',
		photo: 'PHOTO — boucles'
	},
	{
		ref: '#BY-1954',
		date: '29.07.2026',
		title: 'Trousse Denim',
		detail: 'doublure fleurie · 1 article',
		total: '32,00 €',
		state: 'retour',
		status: 'Retour en cours',
		next: 'Colis retour reçu le 06.09, contrôle en cours.',
		action: 'Suivre le retour',
		action2: 'Voir la procédure',
		photo: 'PHOTO — trousse'
	},
	{
		ref: '#BY-1902',
		date: '12.07.2026',
		title: 'Collier personnalisé',
		detail: '7 perles choisies · fermoir doré',
		total: '29,00 €',
		state: 'rembourse',
		status: 'Remboursée',
		next: 'Remboursement de 29,00 € émis le 22.07.',
		action: 'Voir la facture',
		action2: 'Recommander la même',
		photo: 'PHOTO — collier perso'
	}
];

export const accountFields = [
	{ label: 'Adresse e-mail', value: 'emma@exemple.fr' },
	{ label: 'Nom affiché', value: 'Emma L.' },
	{ label: 'Adresse de livraison', value: '12 rue des Olivettes, 44000 Nantes' },
	{ label: 'Téléphone (suivi de colis)', value: '+33 6 12 34 56 78' }
];

export const consents = [
	{
		id: 'news' as const,
		label: 'Nouveautés et collections',
		desc: 'Environ un e-mail par mois, jamais plus.'
	},
	{
		id: 'resto' as const,
		label: 'Retour en stock',
		desc: 'Alerte quand une pièce épuisée revient.'
	},
	{
		id: 'avis' as const,
		label: 'Demande d’avis',
		desc: 'Un seul rappel, 10 jours après la livraison.'
	}
];

export const rgpdActions = [
	{
		label: 'Télécharger mes données',
		desc: 'Archive JSON + CSV, prête en 24 h.',
		cta: 'Exporter'
	},
	{
		label: 'Rectifier mes informations',
		desc: 'Corriger un nom, une adresse, un e-mail.',
		cta: 'Corriger'
	},
	{
		label: 'Limiter le traitement',
		desc: 'Garder le compte, geler l’usage des données.',
		cta: 'Limiter'
	},
	{
		label: 'Retirer mes consentements',
		desc: 'Coupe tous les e-mails non transactionnels.',
		cta: 'Retirer'
	}
];
