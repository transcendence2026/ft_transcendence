import 'reflect-metadata';
import { Prisma } from '@prisma/client';
import { SearchService } from './search.service.js';
import { SearchQueryDto } from './dto/search-query.dto.js';

// @nestjs/common v12 is ESM-only and Jest (CJS) can't load it on Node 22, so
// mock the two things the service uses. The service logic doesn't depend on Nest
jest.mock('@nestjs/common', () => ({
	Injectable: () => () => undefined,
	BadRequestException: class BadRequestException extends Error {},
}));
// eslint-disable-next-line @typescript-eslin/no-require-imports
const { BadRequestException } = require('@nestjs/common');

// Builds a DTO the way ValidationPipe would after transform (limit defaults to 10)
function buildQuery(overrides: Partial<SearchQueryDto> = {}): SearchQueryDto {
	return Object.assign(new SearchQueryDto(), overrides);
}

// Fake rows shaped like the raw query output
function buildRows(count: number, startAt = 1) {
  return Array.from({ length: count }, (_, i) => ({
		id: `r${startAt + i}`,
		name: `Restaurant ${startAt + i}`,
		cuisine: 'ITALIAN',
		priceRange: 2,
		avgRating: 4.2,
		reviewCount: 3,
	}));
}

describe('SearchService', () => {
	let queryRaw: jest.Mock;
	let findUnique: jest.Mock;
	let service: SearchService;

	// Prisma.Sql exposes the final text ($1, $2...) and its values; collapse
	// whitespace so assertions don't depend on the template's identation
	const lastSql = () => {
		const sql = queryRaw.mock.calls[0][0] as Prisma.Sql;
		return { text: sql.text.replace(/\s+/g, ' ').trim(), values: sql.values };
	};

	beforeEach(() => {
		queryRaw = jest.fn().mockResolvedValue([]);
		findUnique = jest.fn();
		const prismaMock = { $queryRaw: queryRaw, restaurant: { findUnique } };
		service = new SearchService(prismaMock as never);
	});
	
	describe('filters', () => {
		it('adds no WHERE/HAVING when no filter is given', async () => {
			await service.search(buildQuery());

			const { text } = lastSql();
			expect(text).not.toContain('WHERE');
			expect(text).not.toContain('HAVING');
		});

		it('filters by cuisine casting the param to the enum type', async () => {
			await service.search(buildQuery({ cuisine: 'ITALIAN' as never }));

			const { text, values } = lastSql();
			expect(text).toContain('WHERE r.cuisine = $1::"Cuisine"');
			expect(values[0]).toBe('ITALIAN');
		});

		it('filters by exact priceRange', async () => {
			await service.search(buildQuery({ price: 3 }));

			const { text, values } = lastSql();
			expect(text).toContain('WHERE r."priceRange" = $1');
			expect(values[0]).toBe(3);
		});
	
		it('puts the rating filter in HAVING, not in WHERE', async () => {
			await service.search(buildQuery({ rating: 4 }));

			const { text, values } = lastSql();
			expect(text).toContain('HAVING AVG(rev.rating) >= $1');
			expect(text).not.toContain('WHERE');
			expect(values[0]).toBe(4);
		});

		it('searches the text in restaurant name and in dish names', async () => {
			await service.search(buildQuery({ q: 'pizza' }));

			const { text, values } = lastSql();
			expect(text).toContain('r.name ILIKE $1');
			expect(text).toContain('dq.name ILIKE $2');
			expect(values.slice(0, 2)).toEqual(['%pizza%', '%pizza%']);
		});

		it('escapes LIKE wildcards typed by the user', async () => {
			await service.search(buildQuery({ q: '100%_off\\' }));

			expect(lastSql().values[0]).toBe('%100\\%\\_off\\\\%');
		});

		it('combines every filter with AND and keeps rating in HAVING', async () => {
			await service.search(
				buildQuery({ cuisine: 'JAPANESE' as never, price: 2, rating: 3.5, q: 'sushi' }),
			);
	
			const { text, values } = lastSql();
			expect(text).toContain('r.cuisine = $1::"Cuisine" AND r."priceRange" = $2 AND (');
			expect(text).toContain('HAVING AVG(rev.rating) >= $5');
			expect(values.slice(0, 5)).toEqual(['JAPANESE', 2, '%sushi%', '%sushi%', 3.5]);
		});
	
		it('computes the average in the same query (single aggregated query, no N+1)', async () => {
			await service.search(buildQuery());

			expect(queryRaw).toHaveBeenCalledTimes(1);
			expect(lastSql().text).toContain('AVG(rev.rating)::float8 AS "avgRating"');
			expect(lastSql().text).toContain('GROUP BY r.id');
		});
	});

	describe('pagination', () => {
		it('orders by createdAt DESC, id DESC and asks for limit + 1 rows', async () => {
			await service.search(buildQuery({ limit: 5 }));

			const { text, values } = lastSql();
			expect(text).toContain('ORDER BY r."createdAt" DESC, r.id DESC');
			expect(text).toMatch(/LIMIT \$\d+$/);
			expect(values[values.length - 1]).toBe(6);
		});

		it('returns nextCursor = id of the last returned row when there are more results', async () => {
			queryRaw.mockResolvedValue(buildRows(4)); // limit + 1

			const res = await service.search(buildQuery({ limit: 3 }));
	
			expect(res.results).toHaveLength(3);
			expect(res.results.map((r) => r.id)).toEqual(['r1', 'r2', 'r3']);
			expect(res.nextCursor).toBe('r3');
		});

		it('returns nextCursor = null on the last page', async () => {
			queryRaw.mockResolvedValue(buildRows(2));

			const res = await service.search(buildQuery({ limit: 3 }));

			expect(res.results).toHaveLength(2);
			expect(res.nextCursor).toBeNull();
		});

		it('returns nextCursor = null when there are exactly limit rows', async () => {
			queryRaw.mockResolvedValue(buildRows(3));

			const res = await service.search(buildQuery({ limit: 3 }));
	
			expect(res.results).toHaveLength(3);
			expect(res.nextCursor).toBeNull();
		});
	
		it('returns an empty page when nothing matches', async () => {
			const res = await service.search(buildQuery({ cuisine: 'THAI' as never }));

			expect(res).toEqual({ results: [], nextCursor: null });
		});
	
		it('applies keyset condition (createdAt, id) < cursor row when a cursor is given', async () => {
			findUnique.mockResolvedValue({ id: 'r7' });

			await service.search(buildQuery({ cursor: 'r7' }));
	
			expect(findUnique).toHaveBeenCalledWith({
				where: { id: 'r7' },
				select: { id: true },
			});
			const { text, values } = lastSql();
			expect(text).toContain('(r."createdAt", r.id) < (');
			expect(values[0]).toBe('r7');
		});
	
		it('combines the cursor with the other filters', async () => {
			findUnique.mockResolvedValue({ id: 'r7' });
	
			await service.search(buildQuery({ cursor: 'r7', price: 2 }));
	
			const { text, values } = lastSql();
			expect(text).toContain('r."priceRange" = $1 AND (r."createdAt", r.id) < (');
			expect(values.slice(0, 2)).toEqual([2, 'r7']);
		});
	
		it('rejects an unknown cursor with 400 and does not run the search query', async () => {
			findUnique.mockResolvedValue(null);
	
			await expect(service.search(buildQuery({ cursor: 'nope' }))).rejects.toThrow(
				BadRequestException,
			);
			expect(queryRaw).not.toHaveBeenCalled();
		});
	
		it('does not look the cursor up when none is given', async () => {
			await service.search(buildQuery());
	
			expect(findUnique).not.toHaveBeenCalled();
		});
	});
});