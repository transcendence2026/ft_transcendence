import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SearchQueryDto } from './search-query.dto';

// Mirrors what ValidationPipe({ transform: true }) does with the query string:
// every value arrives as a string
async function parse(query: Record<string, string>) {
	const dto = plainToInstance(SearchQueryDto, query);
	const errors = await validate(dto);
	return { dto, errors, failedProps: errors.map((e) => e.property) };
}

describe('SearchQueryDto', () => {
	it('accepts an empty query and defaults limit to 10', async () => {
		const { dto, errors } = await parse({});

		expect(errors).toHaveLength(0);
		expect(dto.limit).toBe(10);
	});

	it('converts numeric strings to numbers', async () => {
    const { dto, errors } = await parse({ price: '3', rating: '4.5', limit: '20' });

    expect(errors).toHaveLength(0);
    expect(dto.price).toBe(3);
    expect(dto.rating).toBe(4.5);
    expect(dto.limit).toBe(20);
  });

  it('treats empty strings as "not provided"', async () => {
    const { dto, errors } = await parse({ cuisine: '', price: '', rating: '', q: '', cursor: '', limit: '' });

    expect(errors).toHaveLength(0);
    expect(dto.cuisine).toBeUndefined();
    expect(dto.price).toBeUndefined();
    expect(dto.limit).toBe(10);
  });

  it('accepts a valid cuisine and rejects an unknown one', async () => {
    expect((await parse({ cuisine: 'ITALIAN' })).errors).toHaveLength(0);
    expect((await parse({ cuisine: 'italian' })).failedProps).toContain('cuisine');
    expect((await parse({ cuisine: 'PIZZA' })).failedProps).toContain('cuisine');
  });

  it.each(['0', '5', '2.5', 'abc'])('rejects price=%s (must be an integer 1-4)', async (price) => {
    expect((await parse({ price })).failedProps).toContain('price');
  });

  it.each(['1', '2', '3', '4'])('accepts price=%s', async (price) => {
    expect((await parse({ price })).errors).toHaveLength(0);
  });

  it.each(['0', '0.9', '5.1', 'abc'])('rejects rating=%s (must be 1-5)', async (rating) => {
    expect((await parse({ rating })).failedProps).toContain('rating');
  });

  it.each(['0', '-1', '51', '1000000', '1.5', 'abc'])(
    'rejects limit=%s (must be an integer 1-50)',
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