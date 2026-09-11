import * as v from 'valibot';
import { emailSchema } from './auth';

export const trackingSchema = v.object({
	reference: v.pipe(
		v.string('Indique la référence de ta commande.'),
		v.trim(),
		v.toUpperCase(),
		v.regex(
			/^[Bb][Yy]-[0-9A-Za-z]{8}$/,
			'Cette référence ne ressemble pas à une référence Bylikki.'
		)
	),
	email: emailSchema
});
