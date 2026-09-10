/**
 * Amorcage de la base : compte administrateur, puis un jeu de demonstration
 * facultatif.
 *
 * Le script tourne hors de Vite : les alias `$lib`, `$env`, `$app` et `$prisma`
 * n'y resolvent pas. Il construit donc son propre client Prisma et n'importe du
 * code applicatif que ce qui est pur et sans alias (`text.ts`), pour que le
 * `searchText` des produits soit calcule par la meme fonction que
 * l'administration -- une copie locale divergerait en silence.
 *
 *   bun db:seed                 compte admin + jeu de demonstration
 *   bun db:seed -- --admin-only  compte admin seul
 *   bun db:seed -- --purge-demo  supprime le jeu de demonstration, puis sort
 *
 * Tout est idempotent : chaque entite est ecrite par `upsert` sur une cle
 * stable, jamais par `deleteMany` global. Relancer le script ne cree rien de
 * nouveau et n'ecrase aucun reglage modifie depuis l'administration.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { settingDefaults, type SettingKey } from '../src/lib/client/validation/settings';
import { seedDemo } from './seed-demo';

/** Tout ce que le jeu de demonstration cree porte l'une de ces marques. */
const DEMO_SLUG_PREFIX = 'demo-';
const DEMO_EMAIL_PREFIX = 'demo+';
const DEMO_CODE_PREFIX = 'DEMO';

const args = process.argv.slice(2);
const adminOnly = args.includes('--admin-only');
const purgeDemo = args.includes('--purge-demo');

function fail(message: string): never {
	console.error(`\n  ${message}\n`);
	process.exit(1);
}

/** Controles avant toute connexion : echouer vite et en nommant la variable. */
const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? '').trim().toLowerCase();

if (!process.env.PRISMA_DATABASE_URL) {
	fail(
		'PRISMA_DATABASE_URL est absent : impossible de joindre la base.\n' +
			'  Renseigne-la dans .env, puis relance `bun db:seed`.'
	);
}

if (!purgeDemo && (!adminEmail || !adminEmail.includes('@'))) {
	fail(
		'SEED_ADMIN_EMAIL est absent ou invalide : je ne sais pas quel compte promouvoir.\n' +
			"  Ajoute par exemple SEED_ADMIN_EMAIL='ton@adresse.fr' dans .env, puis relance `bun db:seed`."
	);
}

/**
 * Un jeu de demonstration n'a rien a faire dans une base de production : le
 * refus est explicite, et se leve consciemment.
 */
if (
	!adminOnly &&
	!purgeDemo &&
	process.env.NODE_ENV === 'production' &&
	process.env.SEED_ALLOW_DEMO_IN_PRODUCTION !== 'true'
) {
	fail(
		"NODE_ENV=production : le jeu de demonstration n'est pas insere.\n" +
			'  Utilise `--admin-only`, ou pose SEED_ALLOW_DEMO_IN_PRODUCTION=true si tu le veux vraiment.'
	);
}

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.PRISMA_DATABASE_URL })
});

const report: string[] = [];

function note(label: string, made: number, kept: number) {
	report.push(`  ${label.padEnd(24)} ${made} cree(s), ${kept} a jour`);
}

/** Ne supprime que ce que ce script a pu creer : rien sans prefixe n'est touche. */
async function purgeDemoData() {
	const products = await prisma.product.deleteMany({
		where: { slug: { startsWith: DEMO_SLUG_PREFIX } }
	});
	const users = await prisma.user.deleteMany({
		where: { email: { startsWith: DEMO_EMAIL_PREFIX } }
	});
	const discounts = await prisma.discount.deleteMany({
		where: { code: { startsWith: DEMO_CODE_PREFIX } }
	});
	const components = await prisma.component.deleteMany({
		where: { key: { startsWith: DEMO_SLUG_PREFIX } }
	});

	console.log(
		`\n  Jeu de demonstration supprime : ${products.count} produit(s), ${users.count} compte(s), ` +
			`${discounts.count} code(s), ${components.count} composant(s).\n`
	);
}

/**
 * Le compte administrateur. `upsert` sur l'e-mail : si la personne s'est deja
 * connectee, on ne fait que la promouvoir, sans toucher a son nom d'affichage
 * ni reinitialiser sa date de verification.
 */
async function seedAdmin() {
	const existing = await prisma.user.findUnique({
		where: { email: adminEmail },
		select: { id: true, role: true, emailVerifiedAt: true }
	});

	const user = await prisma.user.upsert({
		where: { email: adminEmail },
		create: { email: adminEmail, role: 'ADMIN', emailVerifiedAt: new Date() },
		update: { role: 'ADMIN', emailVerifiedAt: existing?.emailVerifiedAt ?? new Date() },
		select: { id: true, email: true }
	});

	if (!existing) {
		console.log(`  Compte administrateur cree : ${user.email}`);
	} else if (existing.role !== 'ADMIN') {
		console.log(`  Compte existant promu administrateur : ${user.email}`);
	} else {
		console.log(`  Compte administrateur deja en place : ${user.email}`);
	}

	return user;
}

/**
 * Reglages de la boutique. `update: {}` est deliberé : une relance ne doit
 * jamais ecraser un reglage modifie depuis l'administration. Seule une cle
 * absente est creee, avec sa valeur par defaut.
 */
async function seedSettings() {
	const existing = await prisma.siteSetting.findMany({ select: { key: true } });
	const known = new Set(existing.map((row) => row.key));
	const keys = Object.keys(settingDefaults) as SettingKey[];

	for (const key of keys) {
		await prisma.siteSetting.upsert({
			where: { key },
			create: { key, value: settingDefaults[key] },
			update: {}
		});
	}

	const made = keys.filter((key) => !known.has(key)).length;
	note('reglages', made, keys.length - made);
}

async function main() {
	if (purgeDemo) {
		await purgeDemoData();
		return;
	}

	console.log('');
	await seedAdmin();
	await seedSettings();

	if (adminOnly) {
		console.log('\n  --admin-only : jeu de demonstration ignore.\n');
		return;
	}

	await seedDemo(prisma, (line) => report.push(`  ${line}`));

	console.log('');
	for (const line of report) {
		console.log(line);
	}
	console.log('\n  Termine. Connecte-toi avec ' + adminEmail + ' pour atteindre /admin.\n');
}

try {
	await main();
} catch (cause) {
	console.error('\n  Le seed a echoue :', cause instanceof Error ? cause.message : cause, '\n');
	process.exit(1);
} finally {
	await prisma.$disconnect();
}
