import { Prisma } from "@prisma/client";

// Same relations for every dish query
export const DISH_INCLUDE = {
	restaurant: { select: { id: true, name: true, cuisine: true, priceRange: true } },
	tags: { select: { name: true } },
} as const;

export type DishWithRelations = Prisma.DishGetPayload<{ include: typeof DISH_INCLUDE }>;