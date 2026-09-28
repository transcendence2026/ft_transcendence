import { cosineSimilarity } from './cosine-similarity-prototype';

describe('cosineSimilarity', () => {
  test('vectores idénticos → similitud 1', () => {
    expect(cosineSimilarity([1, 1], [1, 1])).toBeCloseTo(1);
  });

  test('vectores ortogonales → similitud 0', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  test('vectores opuestos → similitud -1', () => {
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1);
  });

  test('vector de ceros devuelve 0 (no lanza excepción)', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  test('vectores de distinta longitud lanzan error', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow(
      'Vectors must have the same dimension',
    );
  });

  test('perfiles similares dan una similitud alta pero no perfecta', () => {
    const userA = [5, 4, 1, 0];
    const userB = [4, 5, 1, 0];
    const similarity = cosineSimilarity(userA, userB);
    expect(similarity).toBeGreaterThan(0.9);
    expect(similarity).toBeLessThan(1);
  });

  test('perfiles con gustos opuestos dan similitud baja', () => {
    const userA = [5, 4, 1, 0];
    const userC = [0, 0, 5, 5];
    expect(cosineSimilarity(userA, userC)).toBeLessThan(0.3);
  });
});
