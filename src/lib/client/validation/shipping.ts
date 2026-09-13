import * as v from 'valibot';

export const SHIPPING_COUNTRIES = [
	{ value: 'FR', label: 'France' },
	{ value: 'BE', label: 'Belgique' },
	{ value: 'CH', label: 'Suisse' },
	{ value: 'LU', label: 'Luxembourg' }
] as const;

export type CountryCode = (typeof SHIPPING_COUNTRIES)[number]['value'];

export const countrySchema = v.picklist(['FR', 'BE', 'CH', 'LU']);

export const isCountryCode = (value: string): value is CountryCode =>
	SHIPPING_COUNTRIES.some((country) => country.value === value);

export const CARRIERS = ['MONDIAL_RELAY', 'COLISSIMO', 'CHRONOPOST', 'LA_POSTE'] as const;

export type CarrierCode = (typeof CARRIERS)[number];

export const carrierLabels: Record<CarrierCode, string> = {
	MONDIAL_RELAY: 'Mondial Relay',
	COLISSIMO: 'Colissimo',
	CHRONOPOST: 'Chronopost',
	LA_POSTE: 'La Poste'
};

export const SHIPMENT_STATUSES = [
	'LABEL_CREATED',
	'IN_TRANSIT',
	'OUT_FOR_DELIVERY',
	'AVAILABLE_AT_PICKUP',
	'DELIVERED',
	'EXCEPTION',
	'RETURNED'
] as const;

export type ShipmentStatusCode = (typeof SHIPMENT_STATUSES)[number];

export const shipmentStatusLabels: Record<ShipmentStatusCode, string> = {
	LABEL_CREATED: 'Étiquette créée',
	IN_TRANSIT: 'En transit',
	OUT_FOR_DELIVERY: 'En cours de livraison',
	AVAILABLE_AT_PICKUP: 'Disponible au point de retrait',
	DELIVERED: 'Livré',
	EXCEPTION: 'Incident de livraison',
	RETURNED: 'Retourné à l’expéditeur'
};

export type DeliveryKind = 'home' | 'relay';

type MethodDefinition = {
	carrier: CarrierCode;
	delivery: DeliveryKind;
	name: string;
	detail: string;
	countries: readonly CountryCode[];
	printsLabels: boolean;
};

export const SHIPPING_METHODS = {
	'mondial-relay-relais': {
		carrier: 'MONDIAL_RELAY',
		delivery: 'relay',
		name: 'Mondial Relay en point relais',
		detail: 'Livré en 3 à 5 jours dans le point de ton choix',
		countries: ['FR', 'BE', 'LU'],
		printsLabels: true
	},
	'colissimo-domicile': {
		carrier: 'COLISSIMO',
		delivery: 'home',
		name: 'Colissimo à domicile',
		detail: 'Livré chez toi en 2 à 3 jours',
		countries: ['FR', 'BE', 'CH', 'LU'],
		printsLabels: true
	},
	'colissimo-point-retrait': {
		carrier: 'COLISSIMO',
		delivery: 'relay',
		name: 'Colissimo en point retrait',
		detail: 'Bureau de poste ou relais, en 2 à 3 jours',
		countries: ['FR', 'BE'],
		printsLabels: true
	},
	'chronopost-domicile': {
		carrier: 'CHRONOPOST',
		delivery: 'home',
		name: 'Chronopost à domicile',
		detail: 'Livré le lendemain avant 13 h',
		countries: ['FR'],
		printsLabels: true
	},
	'chronopost-relais': {
		carrier: 'CHRONOPOST',
		delivery: 'relay',
		name: 'Chronopost en relais Pickup',
		detail: 'Disponible le lendemain dans un relais',
		countries: ['FR'],
		printsLabels: true
	},
	'laposte-lettre-suivie': {
		carrier: 'LA_POSTE',
		delivery: 'home',
		name: 'La Poste lettre suivie',
		detail: 'Dans ta boîte aux lettres en 2 à 4 jours, pour les petites pièces',
		countries: ['FR'],
		printsLabels: false
	}
} as const satisfies Record<string, MethodDefinition>;

export type ShippingMethodKey = keyof typeof SHIPPING_METHODS;

export const SHIPPING_METHOD_KEYS = Object.keys(SHIPPING_METHODS) as ShippingMethodKey[];

export const shippingMethodSchema = v.picklist(
	SHIPPING_METHOD_KEYS as [ShippingMethodKey, ...ShippingMethodKey[]]
);

export const isShippingMethod = (value: string | null | undefined): value is ShippingMethodKey =>
	value !== null && value !== undefined && value in SHIPPING_METHODS;

const cents = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100_000));
const grams = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(30_000));
const countryPrice = v.nullable(cents);
const shortText = (max: number) => v.pipe(v.string(), v.trim(), v.maxLength(max));

const methodSettingsSchema = v.object({
	enabled: v.boolean(),
	prices: v.object({ FR: countryPrice, BE: countryPrice, CH: countryPrice, LU: countryPrice })
});

export const senderSchema = v.object({
	name: shortText(80),
	line1: shortText(120),
	line2: shortText(120),
	postalCode: shortText(10),
	city: shortText(80),
	country: countrySchema,
	phone: shortText(20),
	email: shortText(120)
});

export const shippingSettingsSchema = v.object({
	freeThresholdCents: cents,
	packagingGrams: grams,
	designWeightGrams: grams,
	sender: senderSchema,
	methods: v.object({
		'mondial-relay-relais': methodSettingsSchema,
		'colissimo-domicile': methodSettingsSchema,
		'colissimo-point-retrait': methodSettingsSchema,
		'chronopost-domicile': methodSettingsSchema,
		'chronopost-relais': methodSettingsSchema,
		'laposte-lettre-suivie': methodSettingsSchema
	})
});

export type ShippingSettings = v.InferOutput<typeof shippingSettingsSchema>;

export const shippingDefaults: ShippingSettings = {
	freeThresholdCents: 6000,
	packagingGrams: 80,
	designWeightGrams: 60,
	sender: {
		name: 'BYLIKKI',
		line1: '',
		line2: '',
		postalCode: '',
		city: 'Nantes',
		country: 'FR',
		phone: '',
		email: ''
	},
	methods: {
		'mondial-relay-relais': { enabled: true, prices: { FR: 390, BE: 490, CH: null, LU: 490 } },
		'colissimo-domicile': { enabled: true, prices: { FR: 490, BE: 990, CH: 1490, LU: 990 } },
		'colissimo-point-retrait': { enabled: true, prices: { FR: 440, BE: 890, CH: null, LU: null } },
		'chronopost-domicile': { enabled: true, prices: { FR: 990, BE: null, CH: null, LU: null } },
		'chronopost-relais': { enabled: true, prices: { FR: 690, BE: null, CH: null, LU: null } },
		'laposte-lettre-suivie': { enabled: false, prices: { FR: 290, BE: null, CH: null, LU: null } }
	}
};

const legacyShippingSchema = v.object({
	flatCents: cents,
	freeThresholdCents: cents,
	countries: v.pipe(v.array(countrySchema), v.minLength(1))
});

export function upgradeLegacyShipping(
	legacy: v.InferOutput<typeof legacyShippingSchema>
): ShippingSettings {
	const priceFor = (country: CountryCode) =>
		legacy.countries.includes(country) ? legacy.flatCents : null;
	const disabled = Object.fromEntries(
		SHIPPING_METHOD_KEYS.map((key) => [key, { ...shippingDefaults.methods[key], enabled: false }])
	) as ShippingSettings['methods'];

	return {
		...shippingDefaults,
		freeThresholdCents: legacy.freeThresholdCents,
		methods: {
			...disabled,
			'colissimo-domicile': {
				enabled: true,
				prices: { FR: priceFor('FR'), BE: priceFor('BE'), CH: priceFor('CH'), LU: priceFor('LU') }
			}
		}
	};
}

export const storedShippingSchema = v.union([
	shippingSettingsSchema,
	v.pipe(legacyShippingSchema, v.transform(upgradeLegacyShipping))
]);

export function quoteShipping(
	settings: ShippingSettings,
	key: ShippingMethodKey,
	country: string,
	subtotalCents: number
) {
	const definition = SHIPPING_METHODS[key];
	const method = settings.methods[key];

	if (!method.enabled || !isCountryCode(country)) {
		return null;
	}

	if (!(definition.countries as readonly CountryCode[]).includes(country)) {
		return null;
	}

	const price = method.prices[country];

	if (price === null) {
		return null;
	}

	return subtotalCents >= settings.freeThresholdCents ? 0 : price;
}

export type OfferedMethod = {
	key: ShippingMethodKey;
	carrier: CarrierCode;
	delivery: DeliveryKind;
	name: string;
	detail: string;
	priceCents: number;
};

export function offeredMethods(
	settings: ShippingSettings,
	country: string,
	subtotalCents: number
): OfferedMethod[] {
	return SHIPPING_METHOD_KEYS.flatMap((key) => {
		const priceCents = quoteShipping(settings, key, country, subtotalCents);
		const { carrier, delivery, name, detail } = SHIPPING_METHODS[key];

		return priceCents === null ? [] : [{ key, carrier, delivery, name, detail, priceCents }];
	});
}

export function parcelWeightGrams(
	items: { quantity: number; weightGrams: number | null }[],
	settings: Pick<ShippingSettings, 'packagingGrams' | 'designWeightGrams'>
) {
	return (
		settings.packagingGrams +
		items.reduce(
			(total, item) => total + item.quantity * (item.weightGrams ?? settings.designWeightGrams),
			0
		)
	);
}

export function trackingUrl(
	carrier: CarrierCode,
	trackingNumber: string,
	postalCode?: string | null
) {
	const number = encodeURIComponent(trackingNumber);

	switch (carrier) {
		case 'MONDIAL_RELAY':
			return `https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=${number}${
				postalCode ? `&CodePostal=${encodeURIComponent(postalCode)}` : ''
			}`;
		case 'CHRONOPOST':
			return `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${number}`;
		default:
			return `https://www.laposte.fr/outils/suivre-vos-envois?code=${number}`;
	}
}

export const relaySearchSchema = v.object({
	method: shippingMethodSchema,
	country: countrySchema,
	postalCode: v.pipe(
		v.string('Indique un code postal.'),
		v.trim(),
		v.regex(/^[0-9]{4,5}$/, 'Indique un code postal valide.')
	)
});
