import * as v from 'valibot';

export const issueSchema = v.object({
	subject: v.pipe(
		v.string('Donne un objet à cette lettre.'),
		v.trim(),
		v.minLength(3, 'Cet objet est trop court.'),
		v.maxLength(120, 'Cet objet est trop long.')
	),
	body: v.pipe(
		v.string('Écris le contenu de la lettre.'),
		v.trim(),
		v.minLength(20, 'Cette lettre est trop courte.'),
		v.maxLength(8000, 'Cette lettre est trop longue.')
	)
});
