import { normalizeEmail } from '../utils/email';
import { prisma } from './client';

export async function findPublicOrder(reference: string, rawEmail: string) {
	const order = await prisma.order.findUnique({
		where: { reference },
		select: {
			reference: true,
			contactEmail: true,
			status: true,
			paymentStatus: true,
			trackingNumber: true,
			createdAt: true,
			paidAt: true,
			shippedAt: true,
			deliveredAt: true,
			cancelledAt: true,
			shippingCity: true,
			items: {
				select: {
					id: true,
					productName: true,
					variantLabel: true,
					quantity: true
				}
			}
		}
	});

	if (!order || normalizeEmail(order.contactEmail) !== normalizeEmail(rawEmail)) {
		return null;
	}

	const { contactEmail: _contactEmail, ...visible } = order;

	return visible;
}
