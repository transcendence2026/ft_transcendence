import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserSearchQueryDto } from './user-search-query.dto.js';
import { error } from 'console';
import { resourceLimits } from 'worker_threads';

// Mirrors what ValidationPipe({ transform: true }) does with the query string:
// every value arrives as a string
async function parse(query: Record<string, string>) {
	const dto = plainToInstance(UserSearchQueryDto, query);
	const errors = await validate(dto);
	return { dto, errors, failedProps: errors.map((e) => e.property) };
}

describe('UserSearchQueryDto', () => {
	it('accepts an empty query and defaults limit to 10', async () => {
		const { dto, errors } = await parse({});

		expect(errors).toHaveLength(0);
		expect(dto.q).toBeUndefined();
		expect(dto.cursor).toBeUndefined();
		expect(dto.limit).toBe(10);
	});

	it('converts a numeric limit string to a number', async () => {
		const { dto, errors } = await parse({ limit: '20'});

		expect(errors).toHaveLength(0);
		expect(dto.limit).toBe(20);
	});

	it('treats empty strings as "not provided"', async () => {
		const { dto, errors } = await parse({ q: '', cursor: '', limit: '' });

		expect(errors).toHaveLength(0);
		expect(dto.q).toBeUndefined();
		expect(dto.cursor).toBeUndefined();
		expect(dto.limit).toBe(10);
	});

	it('keeps q and cursor as given', async () => {
		const { dto, errors } = await parse({ q: 'adri', cursor: 'abc-123' });

		expect(errors).toHaveLength(0);
		expect(dto.q).toBe('adri');
		expect(dto.cursor).toBe('abc-123');
	});

	it.each(['0', '-1', '51', '1000000', '1.5', 'abc'])(
		'rejects limit=% (must be an integer 1-50)',
		async (limit) => {
			expect((await parse({ limit })).failedProps).toContain('limit');
		},
	);

	it('accepts the limit boundaries 1 and 50', async () => {
		expect((await parse({ limit: '1' })).errors).toHaveLength(0);
		expect((await parse({ limit: '50' })).errors).toHaveLength(0);
	});

	it('rejects free text longer than 100 characters', async () => {
		expect((await parse({ q: 'a'.repeat(101) })).failedProps).toContain('q');
		expect((await parse({ q: 'a'.repeat(100) })).errors).toHaveLength(0);
	});
});