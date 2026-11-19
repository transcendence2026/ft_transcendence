import { Injectable } from '@nestjs/common';
import type { DishWithRelations } from './dish-with-relations.js';

export interface CatalogEntry {
	dish: DishWithRelations;
	vector: number[];
}

@Injectable()
export class VectorCacheService {
	// Safety net: the seed runs in another process and cannot invalidate us
	private static readonly TTL_MS = 10 * 60 * 1000;

	private readonly users = new Map<string, { vector: number[]; expiresAt: number }>();
	private catalog: { entries: CatalogEntry[]; expiresAt: number } |null = null;

	getUserVector(userId: string): number[] | undefined {
		const hit = this.users.get(userId);
		if (!hit) return undefined;
		if (hit.expiresAt < Date.now()) {
			this.users.delete(userId);
			return undefined;
		}
		return hit.vector;
	}

	setUserVector(userId: string, vector: number[]): void {
		this.users.set(userId, { vector, expiresAt: Date.now() + VectorCacheService.TTL_MS });
	}

	getCatalog(): CatalogEntry[] | undefined {
		if (!this.catalog || this.catalog.expiresAt < Date.now()) return undefined;
		return this.catalog.entries;
	}

	setCatalog(entries: CatalogEntry[]): void {
		this.catalog = { entries, expiresAt: Date.now() + VectorCacheService.TTL_MS };
	}

	invalidateUser(userId: string): void {
		this.users.delete(userId);
	}

	invalidateCatalog(): void {
		this.catalog = null;
	}
}