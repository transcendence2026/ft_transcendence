import { jest } from '@jest/globals';
import { VectorCacheService, type CatalogEntry } from './vector-cache.service.js';

const TTL_MS = 10 * 60 * 1000;

// Minimal catalog entry: the cache never looks inside the dish
const makeEntry = (id: string): CatalogEntry => ({
  dish: { id } as any,
  vector: [1, 0, 0],
});

describe('VectorCacheService', () => {
  let cache: VectorCacheService;

  beforeEach(() => {
    jest.useFakeTimers();
    // Fresh instance per test so no entry leaks between tests
    cache = new VectorCacheService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('user vectors', () => {
    it('returns undefined for an unknown user', () => {
      expect(cache.getUserVector('u1')).toBeUndefined();
    });

    it('returns the vector that was stored', () => {
      cache.setUserVector('u1', [0.1, 0.2, 0.3]);
      expect(cache.getUserVector('u1')).toEqual([0.1, 0.2, 0.3]);
    });

    it('keeps users separate from each other', () => {
      cache.setUserVector('u1', [1, 0]);
      cache.setUserVector('u2', [0, 1]);
      expect(cache.getUserVector('u1')).toEqual([1, 0]);
      expect(cache.getUserVector('u2')).toEqual([0, 1]);
    });

    it('invalidateUser removes only that user', () => {
      cache.setUserVector('u1', [1, 0]);
      cache.setUserVector('u2', [0, 1]);
      cache.invalidateUser('u1');
      expect(cache.getUserVector('u1')).toBeUndefined();
      expect(cache.getUserVector('u2')).toEqual([0, 1]);
    });

    it('invalidating an unknown user does not throw', () => {
      expect(() => cache.invalidateUser('nobody')).not.toThrow();
    });

    it('overwrites a previous vector for the same user', () => {
      cache.setUserVector('u1', [1, 0]);
      cache.setUserVector('u1', [0, 1]);
      expect(cache.getUserVector('u1')).toEqual([0, 1]);
    });

    it('expires an entry after the TTL', () => {
      cache.setUserVector('u1', [1, 0]);

      jest.advanceTimersByTime(TTL_MS - 1);
      expect(cache.getUserVector('u1')).toEqual([1, 0]);

      jest.advanceTimersByTime(2);
      expect(cache.getUserVector('u1')).toBeUndefined();
    });
  });

  describe('catalog', () => {
    it('returns undefined when nothing was stored', () => {
      expect(cache.getCatalog()).toBeUndefined();
    });

    it('returns the catalog that was stored', () => {
      const entries = [makeEntry('d1'), makeEntry('d2')];
      cache.setCatalog(entries);
      expect(cache.getCatalog()).toBe(entries);
    });

    it('invalidateCatalog empties the cache', () => {
      cache.setCatalog([makeEntry('d1')]);
      cache.invalidateCatalog();
      expect(cache.getCatalog()).toBeUndefined();
    });

    it('invalidating the catalog does not touch user vectors', () => {
      cache.setUserVector('u1', [1, 0]);
      cache.setCatalog([makeEntry('d1')]);
      cache.invalidateCatalog();
      expect(cache.getUserVector('u1')).toEqual([1, 0]);
    });

    it('invalidating a user does not touch the catalog', () => {
      cache.setUserVector('u1', [1, 0]);
      cache.setCatalog([makeEntry('d1')]);
      cache.invalidateUser('u1');
      expect(cache.getCatalog()).toHaveLength(1);
    });

    it('expires after the TTL', () => {
      cache.setCatalog([makeEntry('d1')]);

      jest.advanceTimersByTime(TTL_MS - 1);
      expect(cache.getCatalog()).toHaveLength(1);

      jest.advanceTimersByTime(2);
      expect(cache.getCatalog()).toBeUndefined();
    });

    it('restarts the TTL when the catalog is stored again', () => {
      cache.setCatalog([makeEntry('d1')]);
      jest.advanceTimersByTime(TTL_MS - 1000);

      cache.setCatalog([makeEntry('d2')]);
      jest.advanceTimersByTime(2000);

      expect(cache.getCatalog()).toHaveLength(1);
    });
  });
});