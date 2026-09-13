import type {
	CarrierCode,
	CountryCode,
	DeliveryKind,
	ShipmentStatusCode,
	ShippingMethodKey
} from '$lib/client/validation/shipping';

export type FetchLike = typeof fetch;

export type RelayPoint = {
	id: string;
	name: string;
	line1: string;
	postalCode: string;
	city: string;
	country: string;
	hours: string[];
	distanceMeters: number | null;
};

export type Party = {
	name: string;
	line1: string;
	line2: string | null;
	postalCode: string;
	city: string;
	country: string;
	email: string | null;
	phone: string | null;
};

export type LabelRequest = {
	reference: string;
	method: ShippingMethodKey;
	direction: 'OUTBOUND' | 'RETURN';
	weightGrams: number;
	sender: Party;
	recipient: Party;
	relayPointId: string | null;
};

export type Label = { trackingNumber: string; pdf: Uint8Array };

export type TrackingUpdate = { status: ShipmentStatusCode; event: string | null };

export type TrackRequest = {
	trackingNumber: string;
	currentStatus: ShipmentStatusCode;
	delivery: DeliveryKind;
};

export type CarrierAdapter = {
	carrier: CarrierCode;
	demo: boolean;
	searchRelays(request: {
		method: ShippingMethodKey;
		postalCode: string;
		country: CountryCode;
	}): Promise<RelayPoint[]>;
	createLabel(request: LabelRequest): Promise<Label>;
	track(request: TrackRequest): Promise<TrackingUpdate>;
};

export class CarrierError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CarrierError';
	}
}
