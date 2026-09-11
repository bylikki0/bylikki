import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { settingDefaults, type SettingKey } from '../src/lib/client/validation/settings';
import { seedDemo } from './seed-demo';

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
