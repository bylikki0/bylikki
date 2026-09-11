import 'dotenv/config';
import { E2E_EMAIL_PREFIX, e2ePrisma } from './support/db';

export default async function globalTeardown() {
	const prisma = e2ePrisma();

	try {
		const users = await prisma.user.deleteMany({
			where: { email: { startsWith: E2E_EMAIL_PREFIX } }
		});
		const otps = await prisma.emailOTP.deleteMany({
			where: { email: { startsWith: E2E_EMAIL_PREFIX } }
		});

		console.log(`[e2e] menage : ${users.count} compte(s), ${otps.count} code(s).`);
	} finally {
		await prisma.$disconnect();
	}
}
