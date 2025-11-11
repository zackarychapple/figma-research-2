import { describe, it, expect } from 'vitest';
import {
  deepFreeze,
  verifyImmutability,
  testImmutability,
  cloneAndFreeze,
  isFrozen,
  isDeeplyFrozen,
} from '../src/immutability';

describe('Immutability', () => {
  describe('deepFreeze', () => {
    it('should freeze a simple object', () => {
      const obj = { a: 1, b: 2 };
      const frozen = deepFreeze(obj);

      expect(Object.isFrozen(frozen)).toBe(true);
      expect(() => {
        (frozen as any).c = 3;
      }).toThrow();
    });

    it('should deep freeze nested objects', () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3,
          },
        },
      };

      const frozen = deepFreeze(obj);

      expect(Object.isFrozen(frozen)).toBe(true);
      expect(Object.isFrozen(frozen.b)).toBe(true);
      expect(Object.isFrozen(frozen.b.d)).toBe(true);
    });

    it('should handle arrays', () => {
      const obj = {
        items: [1, 2, 3],
        nested: [{ a: 1 }, { b: 2 }],
      };

      const frozen = deepFreeze(obj);

      expect(Object.isFrozen(frozen.items)).toBe(true);
      expect(Object.isFrozen(frozen.nested)).toBe(true);
      expect(Object.isFrozen(frozen.nested[0])).toBe(true);
    });

    it('should handle circular references', () => {
      const obj: any = { a: 1 };
      obj.self = obj;

      const frozen = deepFreeze(obj);

      expect(Object.isFrozen(frozen)).toBe(true);
      expect(frozen.self).toBe(frozen);
    });

    it('should handle null and undefined', () => {
      const obj = {
        a: null,
        b: undefined,
      };

      const frozen = deepFreeze(obj);

      expect(Object.isFrozen(frozen)).toBe(true);
      expect(frozen.a).toBe(null);
      expect(frozen.b).toBe(undefined);
    });

    it('should handle dates', () => {
      const obj = {
        date: new Date(),
      };

      const frozen = deepFreeze(obj);

      expect(Object.isFrozen(frozen)).toBe(true);
      expect(frozen.date instanceof Date).toBe(true);
    });
  });

  describe('verifyImmutability', () => {
    it('should verify a frozen object', () => {
      const obj = deepFreeze({ a: 1, b: { c: 2 } });

      expect(() => verifyImmutability(obj)).not.toThrow();
    });

    it('should throw for unfrozen object', () => {
      const obj = { a: 1, b: { c: 2 } };

      expect(() => verifyImmutability(obj)).toThrow('not frozen');
    });

    it('should throw for partially frozen object', () => {
      const obj = { a: 1, b: { c: 2 } };
      Object.freeze(obj);

      expect(() => verifyImmutability(obj)).toThrow('not frozen');
    });

    it('should handle circular references', () => {
      const obj: any = { a: 1 };
      obj.self = obj;
      deepFreeze(obj);

      expect(() => verifyImmutability(obj)).not.toThrow();
    });
  });

  describe('testImmutability', () => {
    it('should return true for frozen object', () => {
      const obj = deepFreeze({ a: 1, b: 2 });

      expect(testImmutability(obj)).toBe(true);
    });

    it('should return false for mutable object', () => {
      const obj = { a: 1, b: 2 };

      expect(testImmutability(obj)).toBe(false);
    });

    it('should return true for primitives', () => {
      expect(testImmutability(42)).toBe(true);
      expect(testImmutability('string')).toBe(true);
      expect(testImmutability(null)).toBe(true);
    });
  });

  describe('cloneAndFreeze', () => {
    it('should create a frozen clone', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = cloneAndFreeze(obj);

      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
      expect(Object.isFrozen(cloned)).toBe(true);
      expect(Object.isFrozen(cloned.b)).toBe(true);
    });

    it('should not freeze original', () => {
      const obj = { a: 1, b: { c: 2 } };
      cloneAndFreeze(obj);

      expect(Object.isFrozen(obj)).toBe(false);
      obj.a = 999;
      expect(obj.a).toBe(999);
    });

    it('should handle arrays', () => {
      const obj = [1, 2, 3];
      const cloned = cloneAndFreeze(obj);

      expect(cloned).not.toBe(obj);
      expect(Object.isFrozen(cloned)).toBe(true);
    });

    it('should handle dates', () => {
      const date = new Date();
      const cloned = cloneAndFreeze(date);

      expect(cloned).not.toBe(date);
      expect(cloned).toBeInstanceOf(Date);
      expect(cloned.getTime()).toBe(date.getTime());
    });
  });

  describe('isFrozen', () => {
    it('should return true for frozen object', () => {
      const obj = Object.freeze({ a: 1 });

      expect(isFrozen(obj)).toBe(true);
    });

    it('should return false for unfrozen object', () => {
      const obj = { a: 1 };

      expect(isFrozen(obj)).toBe(false);
    });

    it('should return true for primitives', () => {
      expect(isFrozen(42)).toBe(true);
      expect(isFrozen('string')).toBe(true);
      expect(isFrozen(null)).toBe(true);
    });
  });

  describe('isDeeplyFrozen', () => {
    it('should return true for deeply frozen object', () => {
      const obj = deepFreeze({ a: 1, b: { c: 2 } });

      expect(isDeeplyFrozen(obj)).toBe(true);
    });

    it('should return false for partially frozen object', () => {
      const obj = { a: 1, b: { c: 2 } };
      Object.freeze(obj);

      expect(isDeeplyFrozen(obj)).toBe(false);
    });

    it('should return true for frozen arrays', () => {
      const arr = deepFreeze([1, 2, { a: 3 }]);

      expect(isDeeplyFrozen(arr)).toBe(true);
    });

    it('should handle circular references', () => {
      const obj: any = { a: 1 };
      obj.self = obj;
      deepFreeze(obj);

      expect(isDeeplyFrozen(obj)).toBe(true);
    });
  });

  describe('Real-world immutability test', () => {
    it('should prevent all modifications', () => {
      const snapshot = deepFreeze({
        name: 'test',
        version: '1.0.0',
        metadata: {
          id: '123',
          scores: [90, 85, 95],
        },
      });

      // Try to modify top-level property
      expect(() => {
        (snapshot as any).version = '2.0.0';
      }).toThrow();

      // Try to modify nested property
      expect(() => {
        (snapshot as any).metadata.id = '456';
      }).toThrow();

      // Try to modify array
      expect(() => {
        (snapshot as any).metadata.scores.push(100);
      }).toThrow();

      // Try to add new property
      expect(() => {
        (snapshot as any).newProp = 'value';
      }).toThrow();

      // Try to delete property
      expect(() => {
        delete (snapshot as any).name;
      }).toThrow();

      // Verify values are unchanged
      expect(snapshot.version).toBe('1.0.0');
      expect(snapshot.metadata.id).toBe('123');
      expect(snapshot.metadata.scores).toEqual([90, 85, 95]);
    });
  });
});
